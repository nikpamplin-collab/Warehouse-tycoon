import assert from 'node:assert/strict';
import fs from 'node:fs';import http from 'node:http';import path from 'node:path';
import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const root=fileURLToPath(new URL('..',import.meta.url));
const legacy=process.env.WT_LEGACY_FOLDER, content={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json'};
let base=root;
const server=http.createServer((req,res)=>{
 const file=new URL(req.url,'http://local').pathname.replace(/^\/game\//,'')||'index.html';
 if(!/^[\w.-]+$/.test(file)||!content[path.extname(file)]||!fs.existsSync(path.join(base,file)))return res.writeHead(404).end();
 res.setHeader('content-type',content[path.extname(file)]);res.setHeader('cache-control','no-cache');fs.createReadStream(path.join(base,file)).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/game/';
const browser=await chromium.launch(process.env.WT_CHROMIUM?{executablePath:process.env.WT_CHROMIUM,args:['--no-sandbox']}:undefined);
try{
 for(const [width,height] of [[320,568],[390,844],[844,390],[1280,900]]){
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:width<900,isMobile:width<900});const p=await ctx.newPage();
  const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.dismiss());
  const btn=n=>p.getByRole('button',{name:n,exact:true});const nav=n=>p.locator('#tabs').getByRole('button',{name:n,exact:true});
  const saved=()=>p.evaluate(()=>JSON.parse(localStorage.getItem(key)));
  const noOverflow=async()=>assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),width);
  await p.goto(url);await p.locator('#newBusiness').fill('Test Haulage');await p.locator('#newSite').fill('Mercia DC');await btn('Start playing').click();await noOverflow();
  assert.deepEqual(await p.locator('#tabs button').allInnerTexts(),['Home','Ops Office','Bids','Invest','Finances','Rivals']);
  assert.equal(await p.locator('#view').getByText('Next decision').count(),0);
  assert.equal(await p.locator('.d21-yard-view figcaption').isVisible(),false);
  if(width===844){const scene=await p.locator('.d27-home').boundingBox();assert.ok(scene.height>=height*.69,JSON.stringify(scene));}
  const dock=p.locator('[data-scene-hit=docks].d21-scene-hit').first();
  await dock.focus();await p.keyboard.press('Enter');await p.getByRole('dialog',{name:'Dock doors'}).waitFor();
  await btn('View in Invest').click();await p.locator('#d17-facilities').waitFor();
  assert.equal(await p.locator('#d17-facilities').evaluate(x=>document.activeElement===x),true);
  await btn('⌂ Return to Home').click();
  assert.equal(await dock.evaluate(x=>document.activeElement===x),true);
  if(width===844)await p.screenshot({path:'/tmp/wt27-home.png'});
  await btn('− Zoom out to UK map').click();await p.locator('#d27-map-mid').press('Enter');await dock.waitFor();
  await btn('− Zoom out to UK map').click();await p.locator('#d27-map-north').press('Enter');
  await btn('Open in Invest').click();await btn('Open warehouse').waitFor();
  await nav('Home').click();
  await p.evaluate(()=>{const s=state.player.sites[0];state.player.cash=500000;s.contracts=[{name:'Fixture',start:state.month,end:state.month+6,spaces:220,moves:1000,storage:16,handling:5.5}];save();});
  await nav('Ops Office').click();await noOverflow();
  const initial=await saved();const before=await p.locator('.d27-table tbody').innerText();
  await btn('Increase Day shift').click();await btn('Increase MHE trucks').click();
  assert.deepEqual(await saved(),initial);assert.notEqual(await p.locator('.d27-table tbody').innerText(),before);
  const step=await btn('Increase Day shift').boundingBox();assert.ok(step.width>=44&&step.height>=44);
  await btn('About Pallet handling').click();await p.getByRole('dialog',{name:'Pallet handling'}).waitFor();await p.keyboard.press('Escape');
  assert.equal(await btn('About Pallet handling').evaluate(x=>document.activeElement===x),true);
  await btn('Save for next month').click();assert.equal((await saved()).player.sites[0].mhePlan.count,1);
  await p.locator('#d21-site-safety').getByRole('button',{name:'Employ'}).click();assert.equal((await saved()).player.sites[0].hs,true);
  if(width===390)await p.screenshot({path:'/tmp/wt27-ops.png',fullPage:true});
  await nav('Invest').click();await noOverflow();let old=await saved();
  await btn('Buy racking').click();assert.equal((await saved()).player.cash,old.player.cash-15000);
  await btn('Buy dock door').click();assert.equal((await saved()).player.sites[0].projects.filter(p=>p.type==='Dock door').length,1);
  await btn('Borrowing').click();old=await saved();await btn('Borrow £25,000 starter cash').click();assert.equal((await saved()).player.cash,old.player.cash+25000);
  await btn('Repay up to £25,000').click();assert.equal((await saved()).player.cash,old.player.cash);
  await btn('Fire protection').click();assert.ok(await btn('Buy roof sprinklers').isDisabled());
  await btn('Racking & docks').click();await p.evaluate(()=>{state.player.history=Array.from({length:6},()=>({profit:20000}));state.player.cash=400000;render();});
  await btn('Use extension mortgage').click();await btn('Confirm mortgage').click();assert.equal((await saved()).player.cash,150000);
  if(width===390)await p.screenshot({path:'/tmp/wt27-invest.png',fullPage:true});
  await nav('Rivals').click();await noOverflow();
  const pair=p.locator('.d27-compare-table');assert.ok((await pair.boundingBox()).width<=width-12);
  const choices=p.getByRole('combobox',{name:'Second operator'});await choices.selectOption({index:2});
  assert.equal(await pair.locator('th,td').count(),15);
  await p.locator('.d27-more summary').click();await noOverflow();
  if(width===320)await p.screenshot({path:'/tmp/wt27-rivals.png',fullPage:false});
  await nav('Bids').click();await p.getByRole('heading',{name:/UK customer tenders/}).waitFor();
  assert.equal(await p.getByText('Price and reputation affect normal awards',{exact:false}).count(),0);
  await btn('About How Bids works').click();
  await p.getByRole('dialog',{name:'How Bids works'}).getByText('Price and reputation affect normal awards',{exact:false}).waitFor();
  await p.keyboard.press('Escape');
  await p.evaluate(()=>{state.player.sites[0].racks=1;state.tenders.unshift({id:'ready',name:'Compact bid test',region:'mid',start:2,term:4,spaces:100,moves:250});render();});
  await p.locator('#d27-tender-0').getByRole('button',{name:'Place bid'}).click();
  const quote=p.locator('#q-ready');await p.locator('#s-ready').fill('20');await p.locator('#h-ready').fill('2');
  assert.equal(await quote.innerText(),'Est. £2,500 / month');
  await btn('Submit bid').click();assert.deepEqual((await saved()).bids.ready,{storage:20,handling:2});
  await btn('My bids').click();assert.equal(await p.locator('.d27-tender').count(),1);
  await btn('Review bid').click();await btn('Withdraw bid').click();assert.equal((await saved()).bids.ready,undefined);
  await btn('Default prices').click();await p.getByLabel('Storage (£ / pallet / month)',{exact:true}).fill('22');
  await p.getByLabel('Pallet move (£ / move)',{exact:true}).focus();
  assert.equal((await saved()).settings.storage,22);await btn('Close').click();
  await nav('Finances').click();await p.getByRole('heading',{name:'Profit & cash',exact:true}).waitFor();await noOverflow();
  await btn('About How Finances works').click();await p.getByRole('dialog',{name:'How Finances works'}).getByText('Profit includes the month',{exact:false}).waitFor();await p.keyboard.press('Escape');
  await btn('Contracts').click();await p.getByRole('heading',{name:'Fixture'}).waitFor();await noOverflow();
  await btn('Company').click();await btn('Borrowing').click();await btn('Repay up to £25,000').waitFor();
  await p.locator('#metrics').getByRole('button',{name:'Complete month'}).click();
  await p.getByRole('dialog').getByRole('button',{name:'Complete month',exact:true}).click();
  assert.equal((await saved()).month,2);
  const result=p.getByRole('dialog',{name:'January 2026 results'});await result.waitFor();
  assert.match(await result.innerText(),/Cash now[\s\S]+Pallet move results[\s\S]+Not completed/);
  assert.equal(await result.locator('details[open]').count(),0);
  await result.getByText('Moves and incidents',{exact:true}).click();
  assert.equal(await result.locator('details[open]').count(),1);
  await btn('Continue').click();assert.equal(await result.count(),0);
  assert.equal(await p.locator('#metrics .advance').evaluate(el=>el===document.activeElement),true);
  await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>navigator.serviceWorker.controller);
  await ctx.setOffline(true);await p.reload();await nav('Ops Office').click();assert.equal((await saved()).month,2);
  assert.deepEqual(errors,[],width+': '+errors.join(';'));await ctx.close();console.log('PASS',width,height);
 }
 {
  const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'no-preference'});
  const p=await ctx.newPage();const errors=[];p.on('pageerror',x=>errors.push(x.message));
  await p.goto(url);await p.locator('#newBusiness').fill('Dispatch test');
  await p.getByRole('button',{name:'Start playing'}).click();
  const nav=n=>p.locator('#tabs').getByRole('button',{name:n,exact:true});
  const btn=n=>p.getByRole('button',{name:n,exact:true});
  const theme=()=>p.evaluate(()=>getComputedStyle(document.body).backgroundColor);
  for(const tab of ['Home','Ops Office','Invest','Bids','Finances','Rivals']){
   await nav(tab).click();
   assert.equal(await theme(),'rgb(24, 36, 49)',tab);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),390,tab);
  }
  await nav('Invest').click();
  const palette=await btn('Buy racking').evaluate(el=>{
   const color=x=>x.match(/\d+/g).slice(0,3).map(Number);
   const lum=c=>c.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((a,n,i)=>a+n*[.2126,.7152,.0722][i],0);
   const ratio=(a,b)=>{const [l,d]=[lum(color(a)),lum(color(b))].sort((x,y)=>y-x);return (l+.05)/(d+.05)};
   const primary=getComputedStyle(el), action=getComputedStyle(document.querySelector('#metrics .advance')), panel=getComputedStyle(el.closest('.d27-buy'));
   return {primary:ratio(primary.color,primary.backgroundColor),cta:ratio(action.color,action.backgroundColor),edge:ratio(primary.backgroundColor,panel.backgroundColor)};
  });
  assert.ok(palette.primary>=4.5&&palette.cta>=4.5&&palette.edge>=3,JSON.stringify(palette));
  await btn('Automation').click();await btn('Buy continuous improvement programme').waitFor();
  await nav('Home').click();
  await p.evaluate(()=>{const s=state.player.sites[0];Object.assign(s,{racks:9,staff:5,shiftStaff:[5,0,0],mheTrucks:1});s.contracts=[{start:1,end:5,spaces:2100,moves:6300,storage:16,handling:5.5}];render();});
  const seek=async t=>p.evaluate(t=>{
   const timeline=document.querySelector('.d21-yard-svg').getAnimations({subtree:true});
   for(const a of timeline){a.pause();a.currentTime=t*29000;}
   const val=sel=>Number(getComputedStyle(document.querySelector(sel)).opacity);
   const translate=sel=>getComputedStyle(document.querySelector(sel)).transform;
   return {stock:val('.d21-retrieval-source'),carried:val('.d21-carried-pallet'),fork:translate('.d21-dispatch-fork'),lorry:translate('.d21-yard-lorry')};
  },t);
  const approach=await seek(.15), pick=await seek(.25), drive=await seek(.49), load=await seek(.69), leave=await seek(.78);
  assert.equal(approach.stock,1);assert.equal(approach.carried,0);
  assert.equal(pick.stock,0);assert.equal(pick.carried,1);
  assert.equal(drive.carried,1);assert.notEqual(drive.fork,pick.fork);
  assert.equal(load.carried,1);assert.equal(load.lorry,(await seek(.63)).lorry);
  assert.equal(leave.carried,0);assert.notEqual(leave.lorry,load.lorry);
  await p.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await p.locator('.d21-dispatch-fork').evaluate(e=>getComputedStyle(e).display),'none');
  assert.equal(await p.locator('.d21-retrieval-source').evaluate(e=>getComputedStyle(e).opacity),'1');
  await p.evaluate(()=>{ const s=state.player.sites[0];s.automationAssets=[{section:0,commissioned:1,expires:120}];render(); });
  assert.equal(await p.locator('.d28-auto-mesh-front').count(),1);
  assert.equal(await p.locator('.d28-auto-mesh-side').count(),1);
  assert.equal(await p.locator('.d28-auto-lamp').count(),3);
  assert.equal(await p.locator('.d28-auto-lamp circle').first().evaluate(x=>getComputedStyle(x).animationName),'none');
  await p.emulateMedia({reducedMotion:'no-preference'});
  assert.equal(await p.locator('.d28-auto-lamp circle').first().evaluate(x=>getComputedStyle(x).animationName),'d28-automation-glow');
  await btn('Pause motion').click();
  assert.equal(await p.locator('.d28-auto-lamp circle').first().evaluate(x=>getComputedStyle(x).animationPlayState),'paused');
  await nav('Ops Office').click();
  assert.equal(await p.locator('.d27-indicators i.auto svg').count(),10);
  await nav('Home').click();
  await p.evaluate(()=>{state.player.sites[0].automationAssets[0].expires=state.month;render();});
  assert.equal(await p.locator('.d28-auto-mesh-front').count(),0);
  await p.evaluate(()=>{state.player.sites[0].mheTrucks=0;render();});
  assert.equal(await p.locator('.d21-dispatch-fork').count(),0);
  assert.deepEqual(errors,[]);await ctx.close();
  console.log('PASS Night Shift on all tabs, action contrast and synchronised rack-to-lorry animation');
 }
 {
  const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  const p=await ctx.newPage(), errors=[];p.on('pageerror',e=>errors.push(e.message));
  const btn=n=>p.getByRole('button',{name:n,exact:true});
  await p.goto(url);await p.locator('#newBusiness').fill('Compact test');await btn('Start playing').click();
  const camera=()=>p.locator('.d21-yard-svg').getAttribute('viewBox');
  const origin=await camera();
  const configure=sections=>p.evaluate(n=>{
   Object.assign(selectedSite(),{sections:n,racks:n*6,staff:3,shiftStaff:[3,0,0],facilityDocks:n,fireProtection:{water:1,roof:1,rack:1},
    automationAssets:[{section:n-1,commissioned:1,expires:120}],contracts:[{start:1,end:5,spaces:1500,moves:3000}],mheTrucks:1});
   render();
  },sections);
  for(const n of [1,2,3,4,5,8]){
   await configure(n);
   assert.equal(await camera(),origin);
   assert.equal(await p.locator('.d21-dock-door').count(),1+2*n);
   assert.equal(await p.locator('.d21-floor-section').count(),n);
   assert.equal(await p.locator('.d28-auto-mesh-front').count(),1);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),390);
   if(process.env.WT_CAPTURES&&[1,4].includes(n))await p.screenshot({path:'/tmp/wt29-compact-'+n+'.png'});
  }
  await btn('View next part of warehouse').click();const panned=await camera();assert.notEqual(panned,origin);
  assert.deepEqual(panned.split(' ').slice(2),origin.split(' ').slice(2));
  assert.equal(await p.locator('.d29-estate-controls output').innerText(),'Site view 2 / 3');
  // Use the visible dock in column 3 to open Invest and return to the same estate window.
  await p.locator('[data-dock-centre="70.5"]').locator('polygon').first().click();
  await btn('View in Invest').click();
  await btn('⌂ Return to Home').click();assert.equal(await camera(),panned);
  await btn('View previous part of warehouse').click();assert.equal(await camera(),origin);
  assert.deepEqual(errors,[]);await ctx.close();console.log('PASS Compact Block growth, extra doors and same-scale navigation');
 }
 if(process.env.WT_V28_FOLDER){
  const ctx=await browser.newContext();const p=await ctx.newPage(),oldKey='warehouse_tycoon_dotv28',newKey='warehouse_tycoon_dotv29';
  base=process.env.WT_V28_FOLDER;await p.goto(url);await p.locator('#newBusiness').fill('Saved v28 company');
  await p.getByRole('button',{name:'Start playing'}).click();
  await p.evaluate(()=>{Object.assign(selectedSite(),{sections:4,racks:20,facilityDocks:2});save();});
  const old=await p.evaluate(k=>localStorage.getItem(k),oldKey);assert.ok(old);
  base=root;await p.goto(url+'?fresh=v29');await p.locator('#d27-home-title').waitFor();
  const imported=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),newKey);
  assert.equal(imported.player.name,'Saved v28 company');assert.equal(imported.player.sites[0].sections,4);
  assert.equal(await p.locator('.d21-dock-door').count(),7);
  await p.evaluate(()=>{state.player.cash+=1000;save();});
  assert.equal(await p.evaluate(k=>localStorage.getItem(k),oldKey),old);
  base=process.env.WT_V28_FOLDER;await p.goto(url+'?fresh=v28');assert.match(await p.title(),/DOTv28/);
  assert.equal(await p.evaluate(k=>localStorage.getItem(k),oldKey),old);
  await ctx.close();base=root;console.log('PASS v28 → v29 → v28, independent saves');
 }
 if(legacy){
  const ctx=await browser.newContext();const p=await ctx.newPage();base=legacy;
  await p.goto(url);await p.locator('#newBusiness').fill('Migrating v25');await p.locator('#newSite').fill('Original warehouse');await p.getByRole('button',{name:'Start playing'}).click();
  const v25key='warehouse_tycoon_dotv25', v29key='warehouse_tycoon_dotv29';
  const v25=await p.evaluate(k=>localStorage.getItem(k),v25key);assert.ok(v25);
  base=root;await p.goto(url+'?fresh=v28');await p.locator('#d27-home-title').waitFor();
  assert.equal((await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),v29key)).player.name,'Migrating v25');
  await p.evaluate(()=>{state.player.cash+=1234;save();});assert.equal(await p.evaluate(k=>localStorage.getItem(k),v25key),v25);
  base=legacy;await p.goto(url+'?fresh=v25');assert.match(await p.title(),/DOTv25/);assert.equal(await p.evaluate(k=>localStorage.getItem(k),v25key),v25);
  await ctx.close();console.log('PASS v25 → v29 → v25, independent saves');
 }
 if(process.env.WT_V27_FOLDER){
  const ctx=await browser.newContext();const p=await ctx.newPage(), oldKey='warehouse_tycoon_dotv27', newKey='warehouse_tycoon_dotv29';
  base=process.env.WT_V27_FOLDER;await p.goto(url);await p.locator('#newBusiness').fill('Saved v27 company');
  await p.getByRole('button',{name:'Start playing'}).click();
  const old=await p.evaluate(k=>localStorage.getItem(k),oldKey);assert.ok(old);
  base=root;await p.goto(url+'?fresh=v28');await p.locator('#d27-home-title').waitFor();
  assert.equal((await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),newKey)).player.name,'Saved v27 company');
  await p.evaluate(()=>{state.player.cash+=1000;save();});
  assert.equal(await p.evaluate(k=>localStorage.getItem(k),oldKey),old);
  base=process.env.WT_V27_FOLDER;await p.goto(url+'?fresh=v27');assert.match(await p.title(),/DOTv27/);
  assert.equal(await p.evaluate(k=>localStorage.getItem(k),oldKey),old);
  await ctx.close();console.log('PASS v27 → v29 → v27, independent saves');
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
