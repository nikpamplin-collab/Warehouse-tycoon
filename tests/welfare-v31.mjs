import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {boot,compile,setup} from './runtime.mjs';
const script=compile(fileURLToPath(new URL('..',import.meta.url)));
const run=()=>{const g=boot(script);setup(g);g.run('const s=selectedSite();state.player.cash=250000');return g;};
const approx=(a,b)=>assert.ok(Math.abs(a-b)<1e-9, a+' ≠ '+b);
test('all three tiers can be bought outright, and upgrades credit only installed facilities',()=>{
 const g=run();
 assert.deepEqual(JSON.parse(g.run('JSON.stringify([1,2,3].map(i=>DOT31Welfare.quote(s,i).cost))')),[20000,50000,125000]);
 const before=g.run('DOT30People.mood(s)');
 assert.equal(g.run('DOT31Welfare.buy(state,s,1).cost'),20000);
 assert.equal(g.run('state.player.cash'),230000);
 assert.ok(g.run('DOT30People.mood(s)')>before);
 assert.equal(g.run('DOT31Welfare.quote(s,2).cost'),35000);
 assert.equal(g.run('DOT31Welfare.quote(s,3).cost'),110000);
 assert.equal(g.run('DOT31Welfare.buy(state,s,1)'),false);
 assert.equal(g.run('DOT31Welfare.buy(state,s,2).cost'),35000);
 assert.equal(g.run('DOT31Welfare.buy(state,s,3).cost'),85000);
 assert.equal(g.run('state.player.cash'),110000);
 assert.equal(g.run('DOT31Welfare.buy(state,s,2)'),false);
 const direct=run();
 assert.equal(direct.run('DOT31Welfare.buy(state,s,3).cost'),125000);
 assert.equal(direct.run('state.player.cash'),125000);
 approx(g.run('DOT30People.mood(s)'),direct.run('DOT30People.mood(s)'));
});
test('failed orders leave cash, site and mood unchanged; ownership is enforced',()=>{
 const g=run();g.run('state.player.cash=19000;s.peopleMood=4.5');
 const original=g.run('JSON.stringify(state)');
 for(const expression of ['DOT31Welfare.buy(state,s,1)','DOT31Welfare.buy(state,s,9)','DOT31Welfare.buy(state,state.rivals[0].sites[0],1)'])assert.equal(g.run(expression),false);
 assert.equal(g.run('JSON.stringify(state)'),original);
});
test('better welfare slows morale loss without stopping it, and does not mint ongoing mood',()=>{
 const g=run();
 const results=JSON.parse(g.run(`JSON.stringify([0,1,2,3].map(t=>{
   s.welfareTier=t;s.peopleMood=7;s.peopleLastMonth=null;
   s.staff=3;s.shiftStaff=[3,0,0];s.managers=1;
   s.peopleHires=[{id:'poor',role:'ops',name:'Test',people:1,experience:1,safety:5,stock:5,salary:3000}];
   const capacity=siteCapacity(s);
   DOT30People.record(s,1,{demand:100,handled:100});
   return [DOT30People.mood(s),siteCapacity(s),capacity];
 }))`));
 assert.ok(results[0][0]<results[1][0]&&results[1][0]<results[2][0]&&results[2][0]<results[3][0]);
 for(const [mood,after,before] of results){assert.ok(mood<7);assert.ok(after<before);}
 for(let t=0;t<=3;t++){g.run('s.welfareTier='+t);assert.equal(g.run('DOT31Welfare.damp(s,.3)'),.3);}
});
test('site-specific SVGs show a kettle, hot kitchen and games lounge when installed',()=>{
 const g=run();
 const art=()=>g.run('warehouseGraphic(s)');
 const base=art(),box=base.match(/<svg class="d21-yard-svg" viewBox="([^"]+)"/)[1];
 assert.doesNotMatch(base,/data-welfare-tier/);
 for(let i=1;i<=3;i++){
  g.run('DOT31Welfare.buy(state,s,'+i+')');const draw=art();
  assert.match(draw,new RegExp('data-welfare-tier="'+i+'"'));
  assert.match(draw,/data-scene-hit="welfare"/);
  assert.equal(draw.match(/data-welfare-tier/g).length,1);
  assert.ok(draw.includes('viewBox="'+box+'"'));
  if(i===1)assert.match(draw,/d31-cold-counter/);else assert.match(draw,/d31-hot-kitchen/);
  if(i===3)assert.match(draw,/d31-pool-table[\s\S]*d31-games-console/);else assert.doesNotMatch(draw,/d31-pool-table|d31-games-console/);
 }
});
