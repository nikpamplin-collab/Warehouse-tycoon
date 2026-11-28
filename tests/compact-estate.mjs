import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {boot,compile,setup} from './runtime.mjs';
const script=compile(fileURLToPath(new URL('..',import.meta.url)));
const ready=()=>{const g=boot(script);setup(g);return g;};
const normal=s=>JSON.parse(JSON.stringify(s));
test('Compact Block is a connected 2x2 floorplate at 100k, with a fixed camera even if scope exceeds it',()=>{
 const g=ready();
 const view=(n,tail='')=>g.run(`DOT21Yard.render({sections:${n},racks:0,spaces:250,occupied:0,dockDoors:${1+n},${tail}})`);
 const plan=n=>normal(g.run(`DOT21Yard.estate({sections:${n}})`));
 const {cells,frontage}=plan(4);
 assert.deepEqual(cells,[[0,0],[1,0],[0,1],[1,1]]);
 assert.equal(frontage,66);
 assert.equal(plan(3).frontage,66);
 const box=html=>html.match(/<svg class="d21-yard-svg" viewBox="([^"]+)"/)[1];
 const initial=box(view(1));
 for(let n=1;n<=24;n++){
  const p=plan(n),draw=view(n);
  assert.equal(box(draw),initial);
  assert.equal((draw.match(/data-built-section=/g)||[]).length,n);
  assert.ok(!draw.includes('d21-built-extension'));
  if(n>4)assert.match(draw,/data-estate-pan="1"/);
  else assert.doesNotMatch(draw,/data-estate-pan/);
  for(let i=1;i<n;i++)assert.ok(p.cells.slice(0,i).some(([a,b])=>Math.abs(a-p.cells[i][0])+Math.abs(b-p.cells[i][1])===1));
 }
 const us=view(9,'estateStep:2');
 assert.deepEqual(box(us).split(' ').slice(2),initial.split(' ').slice(2));
 assert.notEqual(box(us),initial);
});
test('door frontage handles all built bays including legacy retrofits, keeping the original dock centres',()=>{
 const g=ready();let previous=[];
 for(let n=1;n<=24;n++){
  const doors=normal(g.run(`DOT21Yard.dockPlan(${1+2*n},${n})`));
  const {frontage}=normal(g.run(`DOT21Yard.estate({sections:${n}})`));
  const centres=doors.map(d=>d.x+d.width/2);
  assert.equal(doors.length,1+2*n);
  assert.ok(centres.every(c=>c>=2.2&&c<=frontage-2.2));
  for(let i=1;i<centres.length;i++)assert.ok(centres[i]-centres[i-1]>=5.4);
  for(const c of previous)assert.ok(centres.includes(c));
  previous=centres;
 }
});
test('works precede a joined commissioned extension; engine and fitted art use actual site state',()=>{
 const g=ready();
 g.run(`Object.assign(selectedSite(),{projects:[{type:'Expansion',remaining:1}],racks:9});`);
 const before=g.run('JSON.stringify(state)');
 let html=g.run('warehouseGraphic(selectedSite())');
 assert.match(html,/d21-extension-works/);
 assert.equal((html.match(/class="d21-dock-door"/g)||[]).length,2);
 assert.equal(g.run('JSON.stringify(state)'),before);
 g.run('progress(state.player)');
 html=g.run('warehouseGraphic(selectedSite())');
 assert.doesNotMatch(html,/d21-extension-works/);
 assert.match(html,/data-built-section="1"/);
 assert.match(html,/data-fit="50%"/);
 assert.equal((html.match(/class="d21-rack-bay"/g)||[]).length,12);
 assert.equal((html.match(/class="d21-dock-door"/g)||[]).length,3);
});

test('normal 100k to 125k continues at fixed scale with one retrofit and no lost door',()=>{
 const g=ready();
 g.run(`Object.assign(selectedSite(),{sections:4,facilityDocks:1,projects:[{type:'Expansion',remaining:1}]})`);
 const details=()=>g.run('warehouseGraphic(selectedSite())');
 const vb=s=>s.match(/viewBox="([^"]+)"/)[1];
 const doorCentres=s=>Array.from(s.matchAll(/data-dock-centre="([^"]+)"/g),m=>m[1]);
 const before=details();
 assert.equal(doorCentres(before).length,6);
 g.run('progress(state.player)');
 const after=details();
 assert.equal(doorCentres(after).length,7);assert.equal(vb(after),vb(before));
 for(const x of doorCentres(before))assert.ok(doorCentres(after).includes(x));
 assert.match(after,/data-estate-pan="1"/);
});
