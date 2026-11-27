import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compile,boot,setup} from './runtime.mjs';
const code=compile(new URL('..',import.meta.url).pathname);
function opening(seed=1){
 const g=boot(code,seed);
 g.el('d22-guide').checked=true;setup(g);return g;
}
test('guided market is optional; fits a 200-pallet trial and accurately appraises a 400-pallet tender',()=>{
 const g=opening();
 assert.equal(g.run("availableSite(state.player,state.tenders[0]).id"),g.run("selectedSite().id"));
 assert.match(g.run("d22Fit(state.tenders[1]).label"),/400 needed · 250 free now · 150 short.*£15,000.*February/);
 assert.equal(g.run("!!availableSite(state.player,state.tenders[1])"),false);
 const sg=boot(code,1);setup(sg);assert.equal(sg.run("state.tenders.some(t=>t.trial)"),false);
});
test('trial pricing is competitive without scripted wins; win, loss, retry and skip paths remain playable',()=>{
 let wins=0;
 for(let i=1;i<=24;i++){
  const g=opening(i);g.run("bidAll();nextMonth()");wins+=g.run("Number(state.firstContract.result.won)");
 }
 assert.ok(wins>=8&&wins<24,'suggested trial quotes must be viable without a guaranteed win: '+wins);
 const g=opening(1);g.run("state.bids['guide-first-1']={storage:50,handling:25};nextMonth()");
 assert.equal(g.run('state.firstContract.result.won'),false);
 assert.equal(g.run("state.tenders[0].name"),'Wye Tool & Fastener');
 g.run("state.bids['guide-first-2']={storage:12,handling:4.25};nextMonth()");
 assert.equal(g.run('state.firstContract.result.won'),true);
 assert.match(g.run('d22Guide()'),/starts this turn/);
 g.run("nextMonth()");assert.ok(g.run('state.player.last.storage>0'));assert.match(g.run('d22Guide()'),/first trading result/);
 g.run("d22Skip()");assert.equal(g.run("d22Guide()"),'');assert.equal(g.run('state.firstContract.mode'),'sandbox');
 const h=opening();h.run('d22Skip();nextMonth()');assert.equal(h.run("state.tenders.some(t=>t.trial)"),false);
});
test('month-end explanation reconciles and capacity drivers follow the staffed-shift model',()=>{
 const g=opening(4);
 assert.equal(g.run('d22Bottleneck(selectedSite(),[0,0,0],10,1).label'),'no shifts staffed');
 assert.equal(g.run('d22Bottleneck(selectedSite(),[1,0,0],0,1).label'),'people and equipment');
 assert.equal(g.run('d22Bottleneck(selectedSite(),[30,0,0],6,1).label'),'dock doors');
 g.run('bidAll();nextMonth();nextMonth();nextMonth()');
 assert.ok(g.run("state.player.history.every((r,i)=>Math.abs(d22Drivers(r,state.player.history[i-1]).reduce((n,x)=>n+x.value,0)-r.profit)<.0001)"));
 assert.ok(g.run("state.player.history.every((r,i)=>Math.abs(d22Drivers(r,state.player.history[i-1]).reduce((n,x)=>n+x.delta,0)-(r.profit-(state.player.history[i-1]?.profit||0)))<.0001)"));
 assert.doesNotMatch(g.run('state.log.join(" ")'),/won \(£[^)]*\/month forecast\)/);
});
