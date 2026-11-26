import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';
import {compile,boot,setup} from './runtime.mjs';
const here=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'), compiler=compile(here);
const optionalV12=process.env.WT_V12_FOLDER;
const release=fs.readFileSync(path.join(here,'index.html'),'utf8').match(/<title>Warehouse Tycoon (DOTv[0-9]+)<\/title>/)?.[1];
const asJSON=x=>JSON.parse(JSON.stringify(x));
test('new game and all six tabs render',()=>{
 const g=boot(compiler);assert.match(g.el('dialog').innerHTML,/Start your logistics business/);
 setup(g,'A & B <Logistics>','Main "DC"');
 for(const [tab,phrase] of [['office','Dispatch brief'],['market','UK customer tenders'],['warehouse','Site Management'],['investment','Warehouse investment'],['rivals','Opening profit'],['history','Monthly financial results']]){
  g.run(`go('${tab}')`);assert.ok(g.u().includes(phrase),tab);
  assert.match(g.el('tabs').innerHTML,/aria-current="page"/);
 }
 g.run("go('office')");assert.ok(g.u().includes('Main &quot;DC&quot;'));
});
test('map and all yard views are read only and each mode changes the view',()=>{
 const g=boot(compiler);setup(g);
 const before=g.run('JSON.stringify(state)');
 assert.match(g.u(),/NEIGHBOURING MARKETS/i);
 g.click({region:'north'});assert.match(g.u(),/data-region="north" aria-pressed="true"/);
 g.click({region:'mid'});g.click({index:'0'});assert.equal(g.run('tab'),'warehouse');
 g.click({sceneMode:'flow'});assert.match(g.u(),/Put-away/);assert.match(g.u(),/data-scene-mode="flow" aria-pressed="true"/);
 g.click({sceneMode:'build'});assert.match(g.u(),/No investment work is queued/);
 g.click({sceneMode:'floor'});assert.match(g.u(),/aria-label="Storage committed"/);
 assert.equal(g.run('JSON.stringify(state)'),before);
});
test('queue, staffing, completion and reloading a saved month',()=>{
 const g=boot(compiler);setup(g);g.run("go('warehouse');buyRack();staff(1)");
 g.click({sceneMode:'build'});assert.match(g.u(),/Racking<\/b>[\s\S]{0,150}1 month left/);
 g.run('nextMonth()');assert.equal(g.run('state.month'),2);
 assert.equal(g.run('state.player.sites[0].racks'),1);
 assert.match(g.el('dialog').innerHTML,/Handling performance/);
 const resumed=boot(compiler,999,g.store);assert.equal(resumed.run('state.month'),2);
 assert.deepEqual(asJSON(g.run('state.player')),asJSON(resumed.run('state.player')));
});
test('existing v11 save key retained and data unaltered',()=>{
 const source=boot(optionalV12?compile(optionalV12):compiler);setup(source,'Existing Save','Old DC');
 source.run('state.month=37;state.player.cash=180100;state.player.sites[0].racks=4;save()');
 assert.ok(source.store.has('warehouse_tycoon_v11'));
 const copy=boot(compiler,631,source.store);
 assert.deepEqual(asJSON(copy.run('state.player')),asJSON(source.run('state.player')));
 assert.equal(copy.run('state.month'),37);
 assert.ok(copy.u().includes('Old DC'));
});
test('service worker: precache release visuals, offline navigation and scope isolation',async()=>{
 const names=new Set(), listeners=new Map(), requests=[];
 const store={addAll:async requests=>requests.forEach(x=>names.add(new URL(x.url).pathname.split('/').at(-1))),
  put:async x=>names.add(new URL(x).pathname.split('/').at(-1)),match:async x=>names.has(new URL(x).pathname.split('/').at(-1))?'cached ./'+new URL(x).pathname.split('/').at(-1):undefined};
 const cache={open:async()=>store,keys:async()=>['warehouse-tycoon:/game/:12.0.0','warehouse-tycoon:/else/:9','unrelated'],delete:async k=>requests.push(k)};
 let available=true;
 vm.runInNewContext(fs.readFileSync(path.join(here,'sw.js'),'utf8'),{URL,Request,Response,caches:cache,self:{registration:{scope:'https://local.test/game/'},addEventListener:(n,f)=>listeners.set(n,f),skipWaiting:async()=>{},clients:{claim:async()=>{}}},fetch:async()=>{if(!available)throw Error('offline');return new Response('<title>Warehouse Tycoon '+release+'</title>');}});
 let p;listeners.get('install')({waitUntil:x=>p=x});await p;
 for(const f of ['index.html','dotv13.js','dotv13.css','dotv14.js','dotv14.css','icon.png','manifest.webmanifest', 'v15.js','v15.css', 'v16.js','v16.css','v17-nav.css','dotv17-facilities.js','dotv17-facilities.css','v17-staff.js','v17-staff.css']){assert.ok(names.has(f));assert.ok(fs.existsSync(path.join(here,f)));}
 listeners.get('activate')({waitUntil:x=>p=x});await p;assert.deepEqual(requests,['warehouse-tycoon:/game/:12.0.0']);
 available=false;
 listeners.get('fetch')({request:{url:'https://local.test/game/',method:'GET',mode:'navigate'},respondWith:x=>p=x});assert.equal(await p,'cached ./index.html');
 let claimed=false;listeners.get('fetch')({request:{url:'https://local.test/else/',method:'GET',mode:'navigate'},respondWith:()=>claimed=true});assert.equal(claimed,false);
});

import './release-v17.mjs';
import './staff-ops.mjs';
import './facilities.mjs';
import './navigation.mjs';
import './rivals.mjs';

import './economy-v18.mjs';
import './fire-v20.mjs';
