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
  await jump('Map');await p.evaluate(()=>{
   const s=state.player.sites[0];Object.assign(s,{sections:2,racks:9,staff:4,hs:true,stockController:true,managers:1,shiftStaff:[4,0,0],mheTrucks:2,fireProtection:{water:1,roof:1,rack:1}});
   const capacity=siteSpace(s);s.contracts=[{start:state.month,end:state.month+3,spaces:Math.round(capacity*1250/2250),moves:4200}];
   render(); // visual QA only; the fixture must not alter the saved readback below.
  });
  const yard=p.locator('.d21-yard-view').first();assert.equal(await yard.getAttribute('data-fit'),'50%');
  assert.equal(await yard.getAttribute('data-occupancy'),'56%');
  assert.equal(await yard.locator('.d21-rack-bay').count(),6);
  assert.equal(await yard.locator('.d21-pallet').count(),27);
  assert.equal(await yard.locator('svg text').count(),0);
  assert.equal(await yard.locator('.d21-public-road,.d21-loading-yard').count(),2);
  assert.ok(await yard.locator('.d21-perimeter-tree').count()>=10);
  assert.equal(await yard.locator(".d21-cutaway-office .d21-office-person .d21-office-badge").count(),3);
  assert.equal(await yard.locator(".d21-dock-door").count(),3);
  const delivery=yard.locator('.d21-delivery');
  const sample=async fraction=>yard.locator('.d21-yard-svg').evaluate((svg,f)=>{
   for(const e of svg.querySelectorAll('.d21-yard-lorry,.d21-lorry-direction,.d21-unload-pallet')){
    for(const a of e.getAnimations()){ a.pause();a.currentTime=a.effect.getTiming().duration*f; }
   }
   const active=[...svg.querySelectorAll('.d21-lorry-direction')].filter(x=>Number(getComputedStyle(x).opacity)>.99);
   return {position:getComputedStyle(svg.querySelector('.d21-yard-lorry')).transform,
    heading:active.map(x=>x.classList[1]),load:Number(getComputedStyle(svg.querySelector('.d21-unload-pallet')).opacity)};
  },fraction);
  assert.equal(await delivery.count(),1);
  const road=await sample(.17),reverse=await sample(.56),parked=await sample(.68),leave=await sample(.97);
  assert.deepEqual(road.heading,['d21-lorry-east']);
  assert.deepEqual(reverse.heading,['d21-lorry-out']);
  assert.deepEqual(parked.heading,['d21-lorry-out']);assert.equal(parked.load,1);
  assert.deepEqual(leave.heading,['d21-lorry-east']);
  assert.equal(new Set([road.position,reverse.position,parked.position,leave.position]).size,4);
  if(width===1280&&process.env.WT_YARD_FRAMES){
   fs.mkdirSync(process.env.WT_YARD_FRAMES,{recursive:true});
   for(let i=0;i<65;i++){
    await sample(i/65);
    await yard.locator('.d21-yard-svg').screenshot({path:path.join(process.env.WT_YARD_FRAMES,'frame-'+String(i).padStart(3,'0')+'.png')});
   }
  }
  await sample(.68);
  assert.equal(await yard.locator('svg [stroke-dasharray="9 8"]').count(),0);
  assert.equal(await yard.locator('.d21-forklift.d21-shuttle').count(),2);
  assert.equal(await yard.locator('.d20-water-tank').count(),1);
  assert.equal(await yard.locator('.d20-roof-pipework').count(),1);
  assert.ok(await yard.locator('.d20-rack-pipework').count()>0);
  if(width===390||width===1280)await yard.screenshot({path:'/tmp/wt21-cutaway-'+width+'.png'});
  await tap(yard.getByRole('button',{name:'Pause motion'}));
  assert.equal(await yard.locator('.d21-shuttle').first().evaluate(x=>getComputedStyle(x).animationPlayState),'paused');
  assert.equal(await yard.locator('.d21-yard-lorry').evaluate(x=>getComputedStyle(x).animationPlayState),'paused');
  await p.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await yard.locator('.d21-yard-lorry').evaluate(x=>getComputedStyle(x).display),'none');
  assert.equal(await yard.locator('.d21-parked-lorry').evaluate(x=>getComputedStyle(x).display),'inline');
  assert.equal(await yard.locator('.d21-shuttle').first().evaluate(x=>getComputedStyle(x).animationName),'none');
  await tap(yard.getByRole('button',{name:'Enlarge'}));assert.equal(await p.locator('#dialog .d21-yard-svg').count(),1);
  const modal=p.locator('#dialog .d21-zoom-svg');
  await modal.locator('[data-scene-hit="safety"]').press('Enter');
  assert.equal(await p.evaluate(()=>document.activeElement.id),'d21-site-safety');
  const sceneBack=()=>p.getByRole('button',{name:'Back to warehouse visual'});
  await tap(sceneBack()); await modal.waitFor();
  assert.equal(await p.evaluate(()=>document.activeElement?.dataset.sceneHit),'safety');
  await tap(p.getByRole('button',{name:'Close',exact:true}));
  // Use a real pointer/touch on the drawn dock rather than only dispatching a synthetic group click.
  await yard.evaluate(el=>window.scrollBy(0,el.getBoundingClientRect().top-145));
  const reference=await yard.evaluate(el=>el.getBoundingClientRect().top);
  await yard.locator('.d21-dock-door[data-dock="2"] polygon').first().evaluate(el=>el.getBoundingClientRect().y);
  const dockPoint=await yard.evaluate(el=>{
   const g=el.querySelector('.d21-dock-door[data-dock="2"]'),b=g.getBoundingClientRect();
   const points=[];
   for(let x=Math.ceil(b.x+2);x<b.right-2;x++)for(let y=Math.ceil(b.y+2);y<b.bottom-2;y++){
    if([[0,0],[-2,0],[2,0],[0,2],[0,-2]].every(([a,c])=>document.elementFromPoint(x+a,y+c)?.closest('.d21-dock-door')===g))
     points.push({x,y});
   }
   points.sort((a,z)=>Math.hypot(a.x-(b.x+b.width/2),a.y-(b.y+b.height/2))-Math.hypot(z.x-(b.x+b.width/2),z.y-(b.y+b.height/2)));
   if(points.length)return points[0];
   return null;
  });
  assert.ok(dockPoint,'visible dock has a tappable region');
  if(width<500)await p.touchscreen.tap(dockPoint.x,dockPoint.y);else await p.mouse.click(dockPoint.x,dockPoint.y);
  assert.equal(await p.evaluate(()=>document.activeElement.id),'d17-facilities');
  assert.equal(await p.getByRole('button',{name:'Flow',exact:true}).getAttribute('aria-pressed'),'true');
  await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
  assert.equal(await sceneBack().evaluate(el=>getComputedStyle(el).position),'fixed');
  await tap(sceneBack());
  assert.ok(Math.abs(await yard.evaluate(el=>el.getBoundingClientRect().top)-reference)<2,'returns to original scene scroll offset');
  const paths={storage:'d15-investment',handling:'d21-plan',mhe:'d21-mhe',management:'d15-staff',
   operations:'d15-staff',stock:'d21-site-stock',roof:'d21-upgrade-roof',tank:'d21-upgrade-water',
   'rack-fire':'d21-upgrade-rack',expansion:'d21-site-expansion',projects:'d15-projects'};
  for(const [key,id] of Object.entries(paths)){
   await yard.locator('[data-scene-hit="'+key+'"]').first().dispatchEvent('click');
   assert.equal(await p.evaluate(()=>document.activeElement.id),id,key);
   await tap(sceneBack());
  }
  assert.equal(await sceneBack().count(),0);
  // A return from an Operations view restores the same open fold and the exact visual position.
  await jump('Ops');
  await p.locator('details[data-fold="stock"] summary').click();
  const opsYard=p.locator('.d21-yard-view').first();
  await opsYard.evaluate(el=>window.scrollBy(0,el.getBoundingClientRect().top-145));
  const inOps=await opsYard.evaluate(el=>el.getBoundingClientRect().top);
  await opsYard.locator('[data-scene-hit="tank"]').first().dispatchEvent('click');
  await tap(sceneBack());
  assert.ok(await p.locator('details[data-fold="stock"]').evaluate(el=>el.open));
  assert.ok(Math.abs(await opsYard.evaluate(el=>el.getBoundingClientRect().top)-inOps)<2);
  await p.reload();await jump('Ops');
  await ctx.setOffline(true);await p.reload();assert.match(await p.title(),/DOTv21/);await jump('Ops');
  assert.match(await p.locator('#d21-plan').innerText(),/Next-turn plan saved/);
  assert.deepEqual(errors,[]);await ctx.close();console.log('passed browser '+width+'px: navigation, fit, draft, orders, bids and offline');
 }
}finally{await b.close();srv.close();}
