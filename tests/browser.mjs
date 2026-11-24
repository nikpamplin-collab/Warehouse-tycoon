import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium,webkit,devices} from 'playwright';
const current=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const legacy=process.env.WT_V12_FOLDER;
assert.ok(legacy,'Provide WT_V12_FOLDER, a clean copy of v12.');
let folder=legacy, online=true;
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(!online){res.writeHead(503);res.end();return;}
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
 for(const [label,browserType,options] of [['Chromium desktop',chromium,{viewport:{width:1280,height:860}}],['WebKit iPhone profile',webkit,{...devices['iPhone 13'],reducedMotion:'reduce'}]]){
  folder=legacy;online=true;
  const browser=await browserType.launch();
  try{
   const context=await browser.newContext(options),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url);await page.locator('#newBusiness').fill('Test Pallet Co');await page.locator('#newSite').fill('Test DC');
   await page.getByRole('button',{name:'Start playing'}).click();
   await page.getByRole('button',{name:/Complete January/}).click();
   await ready(page);const before=await state(page);
   assert.equal(before.month,2);assert.equal(before.player.name,'Test Pallet Co');
   folder=current;
   await page.reload();await page.getByText('Dispatch brief').waitFor();
   await page.waitForFunction(()=>caches.keys().then(keys=>keys.some(k=>k==='warehouse-tycoon:/game/:13.0.0')));
   await ready(page);
   const after=await state(page);assert.equal(after.month,2);assert.deepEqual(after.player,before.player);
   for(const name of ['Tenders','Rivals','Finances','Office','Warehouses','Office']){
    await page.locator('#tabs').getByRole('button',{name,exact:true}).click();assert.equal(await page.locator('#tabs [aria-current="page"]').innerText(),name);
   }
   await page.locator('.vt-region[data-region=north]').click();assert.equal(await page.locator('.vt-region[data-region=north]').getAttribute('aria-pressed'),'true');
   await page.getByRole('button',{name:'Manage site',exact:true}).click();await page.getByRole('button',{name:'Pallet flow',exact:true}).click();await page.getByText('Put-away',{exact:true}).waitFor();
   await page.getByRole('button',{name:'Build queue',exact:true}).click();await page.getByText('No investment work is queued.').waitFor();
   const w=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,view:innerWidth}));assert.ok(w.doc<=w.view+1,JSON.stringify(w));
   await page.locator('#tabs').getByRole('button',{name:'Office',exact:true}).click();
   await page.getByRole('button',{name:/Complete February/}).click();assert.equal((await state(page)).month,3);
   // A real network failure should fall back to the v13 cache, not a v12 shell.
   await page.waitForFunction(()=>caches.keys().then(keys=>keys.includes('warehouse-tycoon:/game/:13.0.0')&&!keys.includes('warehouse-tycoon:/game/:12.0.0')));
   await context.setOffline(true);await page.reload();await page.getByText('Dispatch brief').waitFor();
   assert.equal((await state(page)).month,3);assert.deepEqual(errors,[]);
   console.log('PASS: '+label+' | v12 save upgrade, five tabs, map, layers, month, reload, offline, no JS errors');
  }finally{await browser.close();}
 }
}finally{server.close();}
