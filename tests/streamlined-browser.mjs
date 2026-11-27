import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const root=fileURLToPath(new URL('..',import.meta.url));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((req,res)=>{
 const n=new URL(req.url,'http://localhost').pathname.replace(/^\/tycoon\//,'')||'index.html',ext=path.extname(n);
 if(!/^[\w.-]+$/.test(n)||!types[ext]||!fs.existsSync(path.join(root,n)))return res.writeHead(404).end();
 res.setHeader('content-type',types[ext]);fs.createReadStream(path.join(root,n)).pipe(res);
});
await new Promise(r=>srv.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+srv.address().port+'/tycoon/';
const b=await chromium.launch(process.env.WT_CHROMIUM?{executablePath:process.env.WT_CHROMIUM,args:['--no-sandbox']}:undefined);
try{
 for(const width of [320,390,1280]){
  const ctx=await b.newContext({viewport:{width,height:width===320?568:width===390?780:900},isMobile:width<500,hasTouch:width<500});const p=await ctx.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url);await p.locator('#newBusiness').fill('Amber Pallet Co');await p.locator('#newSite').fill('Mercia DC');await p.getByRole('button',{name:'Start playing'}).click();
  const nav=p.locator('#tabs');assert.deepEqual(await nav.locator('button').allInnerTexts(),['Map','Ops','Bids','Invest','Cash']);
  assert.match(await p.locator('footer').innerText(),/DOTv21/);assert.match(await p.title(),/DOTv21/);
  const tap=async l=>width<500?l.tap():l.click();const btn=n=>p.getByRole('button',{name:n,exact:true});const jump=n=>tap(nav.getByRole('button',{name:n,exact:true}));
  const save=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('warehouse_tycoon_v11')));
  await jump('Ops');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),width);
  if(width===320)await p.screenshot({path:"/tmp/wt21-320.png"});
  const bounds=await p.evaluate(()=>({k:document.querySelector('.d21-kpi').getBoundingClientRect().top,controls:document.querySelector('.d21-steps').getBoundingClientRect().bottom,nav:document.querySelector('#tabs').getBoundingClientRect().top,widths:[...document.querySelectorAll('.d21-step button')].map(x=>x.getBoundingClientRect().width)}));
  assert.ok(bounds.widths.every(x=>x>=44));
  if(width<=390)assert.ok(bounds.controls<bounds.nav&&bounds.k>0,JSON.stringify(bounds));
  const old=await save();await tap(btn('Increase Day staff'));await tap(btn('Increase MHE trucks'));assert.deepEqual(await save(),old);
  await tap(btn('Apply next-turn plan'));assert.equal((await save()).player.sites[0].mhePlan.count,1);
  await p.reload();await jump('Ops');assert.match(await p.locator('#d21-plan').innerText(),/Next-turn plan saved/);
  if(width===390)await p.screenshot({path:'/tmp/wt21-operations.png',fullPage:true});
  await jump('Invest');assert.match(await p.locator('#d21-upgrade').innerText(),/CASH AFTER/);
  await tap(btn('Increase rack blocks'));assert.match(await p.locator('#d21-upgrade').innerText(),/£30,000/);
  if(width===390)await p.screenshot({path:'/tmp/wt21-investment.png',fullPage:true});
  await tap(btn('Queue racking →'));assert.equal((await save()).player.sites[0].projects.length,2);
  await tap(btn('Flow'));assert.match(await p.locator('#d21-upgrade').innerText(),/Dock door/);
  await tap(btn('Risk'));assert.match(await p.locator('#d21-upgrade').innerText(),/Commission tank and pumps first/);
  await jump('Bids');const price=p.locator('[id^="s-t"]').first();await price.fill('22');assert.match(await p.locator('output.d21-bid-quote').first().innerText(),/At these rates/);
  await jump('Cash');await p.getByRole('heading',{name:'Trading & cash',exact:true}).waitFor();
  await jump('Map');await tap(btn('Rival operators →'));await p.getByRole('heading',{name:'Rival operators',exact:true}).waitFor();
  await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>navigator.serviceWorker.controller);
  await ctx.setOffline(true);await p.reload();assert.match(await p.title(),/DOTv21/);await jump('Ops');
  assert.match(await p.locator('#d21-plan').innerText(),/Next-turn plan saved/);
  assert.deepEqual(errors,[]);await ctx.close();console.log('passed browser '+width+'px: navigation, fit, draft, orders, bids and offline');
 }
}finally{await b.close();srv.close();}
