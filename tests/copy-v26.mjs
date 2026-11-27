import assert from 'node:assert/strict';
import {test} from 'node:test';
import {compile,boot,setup} from './runtime.mjs';
const code=compile(new URL('..',import.meta.url).pathname);
test('player copy distinguishes forecasts, completed work, booked storage and dock capacity',()=>{
 const g=boot(code);setup(g,'Pallet Flow','Signed Handling Depot');
 g.run(`go('warehouse');visualSceneMode='flow';render()`);
 assert.match(g.u(),/Capacity next month/);
 assert.match(g.u(),/Dock pallet moves/);
 assert.match(g.u(),/Pallet handling/);
 assert.match(g.u(),/Signed Handling Depot/,'names are not changed by the copy pass');
 g.run(`go('office');visualSceneMode='floor';render()`);assert.match(g.u(),/Pallet spaces booked this month/);
 g.run(`go('investment')`);assert.match(g.u(),/Racking &amp; docks/);
 assert.match(g.u(),/Racking package/);
 g.run(`nextMonth();go('history')`);
 assert.match(g.u(),/Pallet moves requested/);
 assert.match(g.u(),/Pallet moves completed/);
 assert.match(g.u(),/Loan amount repaid, excluding interest/);
});
test('one-month jobs keep existing saved identity and tender filter does not claim to check handling',()=>{
 const g=boot(code);setup(g);
 g.run(`state.tenders=[{id:'old-spot',region:'mid',name:'Overflow storage · February 2026',spot:true,term:1,spaces:200,moves:400,start:2}];go('market')`);
 assert.match(g.u(),/One-month storage job/);assert.match(g.u(),/Short-term storage · February 2026/);
 assert.equal(g.run('state.tenders[0].name'),'Overflow storage · February 2026');
 assert.match(g.u(),/Checks storage only, not staff or docks/);
 assert.match(g.u(),/One pallet received or despatched counts as one move/);
});
test('£500k cash can fund the deposit but undrawn credit is not cash',()=>{
 const g=boot(code);setup(g);
 g.run(`state.player.history=Array.from({length:6},()=>({profit:20000}));state.player.cash=500000`);
 assert.equal(g.run('d26MortgageOffer(selectedSite()).available'),true);
 assert.match(g.run('d26MortgageCard(selectedSite())'),/Cash now: £500,000 · cash after deposit: £250,000/);
 g.run('d26TakeMortgage()');assert.equal(g.run('state.player.cash'),250000);
 const g2=boot(code);setup(g2);
 g2.run(`state.player.history=Array.from({length:6},()=>({profit:20000}));state.player.sites[0].ownedExtensions=1;state.player.cash=190000`);
 assert.ok(g2.run('v18LoanOffer(state.player).available')>310000);
 assert.equal(g2.run('d26MortgageOffer(selectedSite()).available'),false);
});

