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
  await nav('Finances').click();await p.getByRole('heading',{name:'Profit & cash',exact:true}).waitFor();
  await p.locator('#metrics').getByRole('button',{name:'Complete month'}).click();
  await p.getByRole('dialog').getByRole('button',{name:'Complete month',exact:true}).click();
  assert.equal((await saved()).month,2);
  await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>navigator.serviceWorker.controller);
  await ctx.setOffline(true);await p.reload();await nav('Ops Office').click();assert.equal((await saved()).month,2);
  assert.deepEqual(errors,[],width+': '+errors.join(';'));await ctx.close();console.log('PASS',width,height);
 }
 if(legacy){
  const ctx=await browser.newContext();const p=await ctx.newPage();base=legacy;
  await p.goto(url);await p.locator('#newBusiness').fill('Migrating v25');await p.locator('#newSite').fill('Original warehouse');await p.getByRole('button',{name:'Start playing'}).click();
  const v25key='warehouse_tycoon_dotv25', v27key='warehouse_tycoon_dotv27';
  const v25=await p.evaluate(k=>localStorage.getItem(k),v25key);assert.ok(v25);
  base=root;await p.goto(url+'?fresh=v27');await p.locator('#d27-home-title').waitFor();
  assert.equal((await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),v27key)).player.name,'Migrating v25');
  await p.evaluate(()=>{state.player.cash+=1234;save();});assert.equal(await p.evaluate(k=>localStorage.getItem(k),v25key),v25);
  base=legacy;await p.goto(url+'?fresh=v25');assert.match(await p.title(),/DOTv25/);assert.equal(await p.evaluate(k=>localStorage.getItem(k),v25key),v25);
  await ctx.close();console.log('PASS v25 → v27 → v25, independent saves');
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
