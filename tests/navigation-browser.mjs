import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium,devices}=require('playwright');
const folder=fileURLToPath(new URL('..',import.meta.url));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const file=url.pathname==='/'?'index.html':url.pathname.slice(1);
 if(!/^[A-Za-z0-9_.-]+$/.test(file)||!types[path.extname(file)]){res.writeHead(404);res.end();return;}
 try{const body=await fs.readFile(path.join(folder,file));res.writeHead(200,{'Content-Type':types[path.extname(file)]});res.end(body);}
 catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
try{
 const browser=await chromium.launch({executablePath:process.env.WT_CHROMIUM||undefined});
 try{
  for(const [name,opts] of [
   ['desktop',{viewport:{width:1280,height:860}}],
   ['mobile', {...devices['iPhone 13'],viewport:{width:320,height:640},deviceScaleFactor:1}]
  ]){
   const ctx=await browser.newContext(opts),page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   const push=loc=>opts.hasTouch?loc.tap():loc.click();
   try{
    await page.goto('http://127.0.0.1:'+server.address().port+'/');
    await page.locator('#newBusiness').fill('Amber Logistics');
    await page.locator('#newSite').fill('Mobile Test Warehouse');
    await push(page.getByRole('button',{name:'Start playing',exact:true}));
    const nav=page.getByRole('navigation',{name:'Game sections'});
    const tab=name=>nav.getByRole('button',{name,exact:true});
    const streamlined=(await page.title()).includes('DOTv21');
    await push(tab(streamlined?'Invest':'Investment'));
    if(streamlined)await push(page.locator('[data-fold=bank] summary'));
    await page.getByRole('button',{name:/^Borrow/}).waitFor();
    if(streamlined){await push(tab('Ops'));await push(page.locator('[data-fold=people] summary'));await push(page.locator('[data-fold=stock] summary'));}
    else await push(page.getByRole('button',{name:'Go to operations'}));
    await page.locator('#d15-staff').waitFor();
    assert.equal(await nav.locator('[aria-current="page"]').innerText(),streamlined?'Ops':'Operations');
    const operationsScene=page.locator('a[href="#d15-investment"][data-d15-open-site]').first();
    const animations=await page.locator('.d15-yard-truck,.d15-lift-a,.d15-lift-b,.metric').evaluateAll(items=>items.map(x=>getComputedStyle(x).animationName));
    assert.ok(animations.length>=(streamlined?1:4)&&animations.every(a=>a==='none'),JSON.stringify(animations));
    await push(operationsScene);
    assert.equal(await nav.locator('[aria-current="page"]').innerText(),streamlined?'Invest':'Investment');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'d15-investment');
    await push(tab(streamlined?'Ops':'Operations'));
    if(streamlined)await page.getByRole('combobox',{name:'Choose a warehouse or region'}).selectOption('region:south');
    else await push(page.getByRole('button',{name:'South East',exact:true}));
    await push(page.getByRole('button',{name:streamlined?'Explore opening a site →':'Explore opening a site',exact:true}));
    await page.getByRole('button',{name:streamlined?/Open warehouse/:/Open 25,000 sq ft site/}).waitFor();
    const measures=await page.evaluate(()=>{
     const n=document.getElementById('tabs');
     return {view:innerWidth,doc:document.documentElement.scrollWidth,
      nav:getComputedStyle(n).position,top:n.getBoundingClientRect().top,buttons:Array.from(n.querySelectorAll('button')).map(x=>x.getBoundingClientRect().height)};
    });
    assert.ok(measures.doc<=measures.view+1,JSON.stringify(measures));
    assert.ok(measures.buttons.every(h=>h>=44),JSON.stringify(measures));
    if(opts.hasTouch){assert.equal(measures.nav,'fixed');assert.ok(measures.top>500,JSON.stringify(measures));}
    assert.deepEqual(errors,[]);
    console.log('PASS:',name,'navigation, independent capital controls, zone shortcuts, animation disabled, no layout overflow');
   }finally{await ctx.close();}
  }
 }finally{await browser.close();}
}finally{server.close();}
