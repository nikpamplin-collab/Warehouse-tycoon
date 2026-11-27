import assert from 'node:assert/strict';
import {test} from 'node:test';
import {compile,boot,setup} from './runtime.mjs';
const code=compile(new URL('..',import.meta.url).pathname);
test('cutaway diagnoses current constraints, idle fleet, and queued projects without changing the save',()=>{
 const g=boot(code,42);setup(g);
 assert.match(g.run('warehouseGraphic(selectedSite())'),/No pallet moves forecast this month/);
 g.run(`const ws24=selectedSite(); ws24.racks=9; ws24.staff=15; ws24.mheTrucks=20;
 ws24.contracts=[{id:'test',name:'Dock pressure',start:1,end:12,spaces:2500,moves:12500}];
 ws24.projects=[{type:'Racking',remaining:1,cost:15000}];save()`);
 const before=g.run('JSON.stringify(state)');
 const scene=g.run('warehouseGraphic(ws24)');
 assert.match(scene,/Dock doors limit output/);assert.match(scene,/Storage nearly full/);assert.match(scene,/leased forklifts idle/);
 assert.match(scene,/1 project in progress/);assert.match(scene,/data-diagnostic="dock"/);
 assert.equal(g.run('JSON.stringify(state)'),before);
 g.run('ws24.staff=0; ws24.shiftStaff=[0,0,0]');
 assert.match(g.run('warehouseGraphic(ws24)'),/No staff on shift/);
});
