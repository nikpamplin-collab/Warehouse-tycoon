import assert from 'node:assert/strict';
import {test} from 'node:test';
import {compile,boot,setup} from './runtime.mjs';
const open=(seed=42,store)=>{let g=boot(compile(new URL('..',import.meta.url).pathname),seed,store);if(!store)setup(g);return g;};
test('v18 overhead/capex is player-only; collateral appears at completion',()=>{
 const g=open();
 assert.deepEqual(Array.from(g.run("['mid','north','south'].map(x=>playerSiteOverhead(site(x)))")),[25000,21875,37500]);
 assert.equal(g.run("rivalSiteCosts(site('mid'),0,0).rent"),10295);
 const s=g.run(`(()=>{let c=state.player;c.cash=2000000;expand();let p=c.sites[0].projects[0];return [p.cost,p.remaining,c.cash,v18OwnedValue(c)]})()`);
 assert.deepEqual(Array.from(s),[1000000,6,1000000,0]);
 g.run('for(let i=0;i<6;i++)progress(state.player)');
 assert.equal(g.run('v18OwnedValue(state.player)'),1000000);
 assert.equal(g.run('playerSiteOverhead(selectedSite())'),50000);
});
test('spot can fit the unchanged starter, permits premium, bills both legs once and does not renew',()=>{
 const g=open();
 assert.equal(g.run("siteSpace(selectedSite())"),250);
 assert.equal(g.run("state.tenders.filter(t=>!t.spot).some(t=>availableSite(state.player,t))"),false);
 const s=g.run(`(()=>{let t={id:'sample',name:'Spot sample',region:'mid',spaces:100,moves:200,term:1,start:2,spot:true,marketPrice:1.65};state.tenders=[t];state.rivals=[];go('market');const markup=document.getElementById('view').innerHTML;bidAll();const b=state.bids[t.id];resolveTenders();state.month=2;const s=selectedSite();s.staff=1;const r=runSite(state.player,s,2);state.month=3;return [markup.includes('spot-badge'),b.storage,b.handling,s.contracts[0].end,r.storage,r.handling,r.spotRevenue,renewalTenders(state).length]})()`);
 assert.deepEqual(Array.from(s),[true,26.4,9.07,2,2640,1814,4454,0]);
 assert.equal(g.run(`freeForTender({contracts:[{start:2,end:2,spaces:100},{start:3,end:4,spaces:200}]},{start:2,term:1},250)`),150);
});
test('cash and collateral both gate lending; existing debt amortises, repay is valid',()=>{
 const g=open();
 assert.equal(g.run('v18LoanOffer(state.player).available'),0);
 g.run('state.player.sites[0].ownedExtensions=1;state.player.history=Array.from({length:6},()=>({profit:10000,interest:0,spotRevenue:10000}))');
 assert.equal(g.run('v18LoanOffer(state.player).available'),0);
 g.run('state.player.history.forEach(r=>r.spotRevenue=0);borrow()');
 assert.equal(g.run('state.player.debt'),25000);
 assert.equal(g.run('state.player.cash'),275000);
 const result=g.run(`(()=>{let c=state.player,p=0,i=0;for(let m=0;m<36;m++){let r=v18LoanPayment(c);p+=r.principal;i+=r.interest;}return [c.debt,Math.round(p),Math.round(i),c.loans.length]})()`);
 assert.deepEqual(Array.from(result),[0,25000,3203,0]);
 g.run('state.player.debt=12500;save()');
 const migrated=open(42,new Map(g.store));
 assert.equal(migrated.run('state.player.debt'),12500);
 assert.equal(migrated.run('v18LoanPayment(state.player).interest'),83.33);
 assert.equal(migrated.run('state.player.loans[0].months'),35);
});
