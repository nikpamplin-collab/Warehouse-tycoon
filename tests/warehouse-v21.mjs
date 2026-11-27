import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {boot,compile,setup} from './runtime.mjs';
const script=compile(fileURLToPath(new URL('..',import.meta.url)));
const open=()=>{const g=boot(script);setup(g);return g;};
const howMany=(s,needle)=>s.split(needle).length-1;
test('rack fit-out and loads are independent proportions, with conventional rack geometry',()=>{
 const g=open();
 for(const [racks,sections,stock,bays,load] of [[0,1,0,0,0],[0,1,125,0,12],[9,2,1250,6,27],[18,2,1125,12,48],[18,2,2250,12,96]]){
  const r=g.run(`DOT21Yard.render({sections:${sections},racks:${racks},occupied:${stock},spaces:${racks?2250:250},staff:0,dockDoors:2})`);
  assert.equal(howMany(r,'data-levels="4" data-pallets-per-level="2"'),bays);
  assert.equal(howMany(r,'class="d21-pallet"'),load);
  assert.doesNotMatch(r,/<text\b|Put-away/);
 }
});
test('cutaway uses active contracts, landed fleet and commissioned hardware without mutating its save',()=>{
 const g=open();
 g.run(`Object.assign(selectedSite(),{racks:8,staff:2,shiftStaff:[2,0,0],mheTrucks:2,contracts:[{start:1,end:3,spaces:1250,moves:400},{start:2,end:4,spaces:700,moves:1400}],mhePlan:{count:3,effective:2}})`);
 const before=g.run('JSON.stringify(state)');
 const draw=()=>g.run('warehouseGraphic(selectedSite())');
 let pic=draw();
 assert.match(pic,/data-fit="89%" data-occupancy="56%"/);
 assert.equal(howMany(pic,'class="d21-worker d21-shuttle"'),2);
 assert.equal(howMany(pic,'class="d21-forklift d21-shuttle"'),2);
 assert.doesNotMatch(pic,/d20-water-tank|d20-roof-pipework|d20-rack-pipework/);
 assert.equal(g.run('JSON.stringify(state)'),before);
 g.run("selectedSite().staff=0;selectedSite().shiftStaff=[0,0,0];selectedSite().fireProtection={water:1,roof:1,rack:1}");
 pic=draw();
 assert.equal(howMany(pic,'class="d21-forklift"'),2);
 assert.doesNotMatch(pic,/class="d21-forklift d21-shuttle"|class="d21-worker/);
 assert.match(pic,/d20-water-tank/);assert.match(pic,/d20-roof-pipework/);assert.match(pic,/d20-rack-pipework/);
});
test('perimeter landscaping and road are decorative, outside the rack and occupancy model',()=>{
 const g=open();const pic=g.run('warehouseGraphic(selectedSite())');
 assert.match(pic,/d21-landscape/);assert.match(pic,/d21-public-road/);assert.match(pic,/d21-loading-yard/);
 assert.ok(howMany(pic,'class="d21-perimeter-tree"')>=10);
 assert.equal(howMany(pic,'class="d21-rack-bay"'),0);
 assert.match(pic,/data-fit="0%" data-occupancy="0%"/);
});
test('office seats reflect appointed roles and only outdoor lane markings are dashed',()=>{
 const g=open();
 const draw=()=>g.run('warehouseGraphic(selectedSite())');
 g.run('Object.assign(selectedSite(),{hs:false,stockController:true,managers:0})');
 let pic=draw();
 assert.match(pic,/data-office-role="safety" data-staffed="false"/);
 assert.match(pic,/data-office-role="stock" data-staffed="true"/);
 assert.match(pic,/data-office-role="operations" data-staffed="false"/);
 assert.equal(howMany(pic,'class="d21-office-person"'),1);
 g.run('Object.assign(selectedSite(),{hs:true,stockController:true,managers:3})');
 const before=g.run('JSON.stringify(state)');
 for(const mode of ['floor','flow','build']){
  g.run('visualSceneMode='+JSON.stringify(mode));pic=draw();
  assert.equal(howMany(pic,'class="d21-office-person"'),3);
  assert.doesNotMatch(pic,/stroke-dasharray="9 8"/);
  assert.match(pic,/class="d21-public-road"[\s\S]*?stroke-dasharray="11 8"/);
 }
 assert.equal(g.run('JSON.stringify(state)'),before);
});
test('unracked stock is block-stacked proportionally up to the 250-pallet floor limit',()=>{
 const g=open();
 const draw=()=>g.run('warehouseGraphic(selectedSite())');
 assert.doesNotMatch(draw(),/class="d21-bulk-stack"/);
 g.run('selectedSite().contracts=[{start:1,end:3,spaces:125,moves:90}]');
 let pic=draw();
 assert.match(pic,/data-fit="0%" data-occupancy="50%"/);
 assert.equal(howMany(pic,'class="d21-bulk-stack" data-tiers="1"'),12);
 g.run('selectedSite().contracts[0].spaces=250');
 pic=draw();
 assert.match(pic,/250 of 250 pallet spaces · bulk floor storage/);
 assert.equal(howMany(pic,'class="d21-bulk-stack" data-tiers="2"'),12);
 assert.equal(howMany(pic,'class="d21-pallet"'),24);
});
test('extra dock doors are rendered once commissioned; active handling gets one lorry loop',()=>{
 const g=open();
 const draw=()=>g.run('warehouseGraphic(selectedSite())');
 let pic=draw();
 assert.equal(howMany(pic,'class="d21-dock-door"'),2);
 assert.doesNotMatch(pic,/class="d21-yard-lorry"/);
 g.run('selectedSite().projects=[{type:"Dock door",remaining:1}];selectedSite().contracts=[{start:1,end:3,spaces:200,moves:500}];selectedSite().hs=true');
 pic=draw();
 assert.equal(howMany(pic,'class="d21-dock-door"'),2);
 assert.match(pic,/class="d21-office-person"[^]*class="d21-office-badge"/);
 assert.equal(howMany(pic,'class="d21-office-badge"'),1);
 assert.equal(howMany(pic,'class="d21-yard-lorry"'),1);
 assert.equal(howMany(pic,'class="d21-unload-pallet"'),1);
 g.run('progress(state.player)');
 assert.equal(howMany(draw(),'class="d21-dock-door"'),3);
 g.run('Object.assign(selectedSite(),{sections:8,facilityDocks:1})');
 assert.equal(howMany(draw(),'class="d21-dock-door"'),10);
});
