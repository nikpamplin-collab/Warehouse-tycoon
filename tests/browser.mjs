import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium,webkit,devices} from 'playwright';
const current=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const legacy=process.env.WT_LEGACY_FOLDER||process.env.WT_V12_FOLDER;
const release=(await fs.readFile(path.join(current,'index.html'),'utf8')).match(/<title>Warehouse Tycoon (DOTv[0-9]+)<\/title>/)?.[1];
assert.ok(release,'Expected a versioned app title');
const revision=(await fs.readFile(path.join(current,'sw.js'),'utf8')).match(/const CACHE=family\+"([\d.]+)"/)?.[1];
const cacheKey='warehouse-tycoon:/game/:'+(revision||release.replace('DOTv','')+'.0.0');
assert.ok(legacy,'Provide WT_LEGACY_FOLDER or WT_V12_FOLDER with the prior build.');
const streamlined=Number(release.slice(4))>=21, home=streamlined?'Map':'Office';
let folder=legacy, online=true;
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(!online){req.socket.destroy();return;}
 // Serve static fixtures only, without ever exposing filesystem paths from the request.
 const file=url.pathname==='/game/'?'index.html':url.pathname.replace(/^\/game\//,'');
 if(!/^[A-Za-z0-9_.-]+$/.test(file)||!types[path.extname(file)]){res.writeHead(404);res.end();return;}
 try{const data=await fs.readFile(path.join(folder,file));res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-store'});res.end(data);}
 catch(e){res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port+'/game/';
const ready=page=>page.waitForFunction(()=>!!navigator.serviceWorker.controller);
const state=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('warehouse_tycoon_v11')));
try{
 for(const [label,browserType,options] of [['Chromium desktop',chromium,{viewport:{width:1280,height:860}}],['WebKit iPhone profile',webkit,{...devices['iPhone 13'],reducedMotion:'reduce'}]].filter(([n])=>!process.env.WT_BROWSER_ONLY||n.startsWith(process.env.WT_BROWSER_ONLY))){
  folder=legacy;online=true;
  const opts=browserType===chromium&&process.env.WT_CHROMIUM?{executablePath:process.env.WT_CHROMIUM,args:['--no-sandbox']}:{ };
  const browser=await browserType.launch(opts);
  try{
   const context=await browser.newContext(options),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   const press=locator=>options.hasTouch?locator.tap():locator.click();
   await page.goto(url);await page.locator('#newBusiness').fill('Test Pallet Co');await page.locator('#newSite').fill('Test DC');
   await page.getByRole('button',{name:'Start playing'}).click();
   await page.getByRole('button',{name:/Complete January/}).click();
   await ready(page);const before=await state(page);
   assert.equal(before.month,2);assert.equal(before.player.name,'Test Pallet Co');
   folder=current;
   await page.reload();await page.getByText('Dispatch brief').waitFor();
   await page.waitForFunction(key=>caches.keys().then(keys=>keys.includes(key)),cacheKey);
   await page.waitForFunction(version=>navigator.serviceWorker.controller?.scriptURL.includes('v='+version),release);
   const after=await state(page);assert.equal(after.month,2);assert.deepEqual(after.player,before.player);
   for(const name of streamlined?['Bids','Cash','Map','Ops','Invest','Map']:['Tenders','Rivals','Finances','Office','Operations','Investment','Office']){
    await press(page.locator('#tabs').getByRole('button',{name,exact:true}));assert.equal(await page.locator('#tabs [aria-current="page"]').innerText(),name);
    if(name==='Rivals')await page.getByRole('heading',{name:'Rival operators',exact:true}).waitFor();
    if(name==='Cash'||name==='Finances'&&/^DOTv(?:16|17|18|19|20)$/.test(release))await page.getByRole('heading',{name:'Trading & cash',exact:true}).waitFor();
   }
   await press(page.locator('.vt-region[data-region=north][aria-pressed]'));assert.equal(await page.locator('.vt-region[data-region=north][aria-pressed]').getAttribute('aria-pressed'),'true');
   const beforeLink=await state(page);
   await press(streamlined?page.getByRole('button',{name:'Site team',exact:true}):page.locator('a[href="#d15-staff"][data-d15-open-site]'));
   await page.locator('#d15-staff').waitFor();
   assert.deepEqual(await state(page),beforeLink);
   if(streamlined)await press(page.getByRole('button',{name:'Back to warehouse visual'}));
   else await page.locator('#tabs').getByRole('button',{name:home,exact:true}).click();
   await page.getByRole('button',{name:'Manage site',exact:true}).click();if(streamlined)await press(page.locator('[data-fold=stock] summary'));await page.getByRole('button',{name:'Pallet flow',exact:true}).click();await page.getByText(streamlined?'Signed handling':'Put-away',{exact:true}).waitFor();
   await page.getByRole('button',{name:'Build queue',exact:true}).click();await page.getByText('No investment work is queued.').waitFor();
   if(/^DOTv(?:17|18|19|20)$/.test(release)){
    await page.getByRole('heading',{name:'Equipment & stock control'}).waitFor();
    const roster=(await state(page)).player.sites[0].staff;
    await press(page.getByRole('button',{name:release==='DOTv17'||release==='DOTv18'?'Add one staff next month':'Add one days worker next turn'}));
    assert.equal((await state(page)).player.sites[0].staff,roster);
    await press(page.locator('#tabs').getByRole('button',{name:'Investment',exact:true}));
    await page.getByRole('button',{name:/^Borrow/}).waitFor();
    await page.getByRole('heading',{name:'Dock doors & fire protection'}).waitFor();
   }
   if(streamlined){
    await press(page.getByRole('button',{name:'Increase Day staff',exact:true}));
    await press(page.getByRole('button',{name:'Apply next-turn plan',exact:true}));
    await press(page.locator('#tabs').getByRole('button',{name:'Invest',exact:true}));
    await press(page.locator('[data-fold=bank] summary'));await page.getByRole('button',{name:/^Borrow/}).waitFor();
    await press(page.getByRole('button',{name:'Risk',exact:true}));
    await page.getByRole('heading',{name:'Tank and pumps',exact:true}).waitFor();
   }
   const w=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,view:innerWidth}));assert.ok(w.doc<=w.view+1,JSON.stringify(w));
   await page.locator('#tabs').getByRole('button',{name:home,exact:true}).click();
   await page.getByRole('button',{name:/Complete February/}).click();assert.equal((await state(page)).month,3);
   if(streamlined||/^DOTv(?:17|18|19|20)$/.test(release))assert.equal((await state(page)).player.sites[0].staff,after.player.sites[0].staff+1);
   // A real network failure should fall back to the v13 cache, not a v12 shell.
   await page.waitForFunction(key=>caches.keys().then(keys=>keys.includes(key)&&!keys.includes('warehouse-tycoon:/game/:12.0.0')),cacheKey);
   // Stop the origin instead of toggling the testing protocol's network interceptor.
   const savedTitle=await page.evaluate(async({cacheKey,release})=>{
    const cache=await caches.open(cacheKey);
    const response=await cache.match(new URL('index.html?release='+release,location.href).href);
    return (await response?.text())?.match(/<title>([^<]+)<\/title>/)?.[1];
   },{cacheKey,release});
   assert.equal(savedTitle,'Warehouse Tycoon '+release);
   online=false;
   try{
    await page.reload();await page.getByText('Dispatch brief').waitFor({timeout:10000});
   }catch(e){
    console.error('Offline reload failed on '+label+': '+await page.title(),errors);
    console.error((await page.content()).slice(0,500));
    throw e;
   }
   assert.equal((await state(page)).month,3);assert.deepEqual(errors,[]);
   console.log('PASS: '+label+' | prior-build save upgrade, navigation, map, layers, month, reload, offline, no JS errors');
  }finally{await browser.close();}
 }
}finally{server.close();}

if(!process.env.WT_BROWSER_ONLY)await import('./navigation-browser.mjs');
