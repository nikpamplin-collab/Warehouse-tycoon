import assert from 'node:assert/strict';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {compile,boot,setup} from './runtime.mjs';

const engine=compile(fileURLToPath(new URL('..',import.meta.url)));
const inspect=(g,code)=>JSON.parse(g.run('JSON.stringify('+code+')'));

test('all regional entrants qualify and post positive month-one earnings',()=>{
 for(const seed of [1,2,5,8,13,21,44,144,307,777,1260,9991]){
  const g=boot(engine,seed);setup(g);
  const opening=inspect(g,'state.rivals.map(c=>c.openingViability)');
  assert.equal(opening.length,6);assert.equal(new Set(opening.map(o=>o.region)).size,3);
  assert.ok(opening.every(o=>o.feasible&&o.profit>0&&o.runway>=6),String(seed));
  g.run('nextMonth()');
  assert.ok(g.run('state.rivals.every(c=>c.last.profit>0&&c.last.missed<=c.last.demand*.07)'),String(seed));
 }
});

test('shared sealed tenders let both player and rivals win; current bids do not leak',()=>{
 const g=boot(engine,8);setup(g);
 const result=inspect(g,`(()=>{
  const p=state.player,r=state.rivals.find(c=>c.sites[0].region==='mid'),s=p.sites[0];
  s.racks=9;p.rep=9;
  const t={id:'controlled-competition',region:'mid',name:'Regional distribution',spaces:400,moves:1600,term:12,start:state.month+1,marketPrice:1};
  state.tenders=[t];
  const random=Math.random;Math.random=()=>.5;
  try{
   state.bids[t.id]={storage:1,handling:1};
   const low=aiOffer(r,t);
   state.bids[t.id]={storage:17,handling:6};
   const high=aiOffer(r,t);
   resolveTenders();
   const lost=!p.sites[0].contracts.some(k=>k.id===t.id);
   for(const c of state.rivals)for(const w of c.sites)w.contracts=w.contracts.filter(k=>k.id!==t.id);
   state.bids[t.id]={storage:9,handling:3};
   resolveTenders();
   return {low:low.storage,high:high.storage,lost,won:p.sites[0].contracts.some(k=>k.id===t.id)};
  }finally{Math.random=random;}
 })()`);
 assert.equal(result.low,result.high);
 assert.ok(result.lost&&result.won);
});

test('96 months across six seeds: capacity, authentic market pressure and six viable rivals',()=>{
 let totalCompeted=0,totalRivalWins=0,totalPlayerWins=0;
 for(const seed of [4,7,16,28,45,61]){
  const g=boot(engine,seed);setup(g);
  const x=inspect(g,`(()=>{
   // The player is a fixed benchmark, not a proof of self-funded progression.
   render=save=report=gameplayTick=()=>{};
   const p=state.player,s=p.sites[0];s.racks=6;p.cash=3000000;s.hs=true;
   const original=new Set(state.rivals.map(c=>c.name)), late=new Set();
   let badCapacity=false, competed=0, playerWins=0, rivalWins=0;
   let rivalOrders=new Set();
   const offer=aiOffer;
   aiOffer=(c,t)=>{const o=offer(c,t);if(o&&o.storage*t.spaces+o.handling*t.moves<=(C.storage*t.spaces+C.handling*t.moves)*(t.marketPrice||1)*1.18)rivalOrders.add(t.id);return o;};
   for(let m=1;m<=96;m++){
    p.cash=Math.max(1000000,p.cash);
    if(m===12){s.sections=2;s.racks=18;}
    s.staff=Math.ceil(forecast(s)/Math.max(1,siteProductivity(s))*1.22)+2;
    s.managers=Math.floor(s.staff/10);
    const auctions=state.tenders;
    rivalOrders=new Set();
    const myBids=new Set();
    for(const t of auctions)if(availableSite(p,t)){
     const rate=(t.marketPrice||1)*.87;
     state.bids[t.id]={storage:C.storage*rate,handling:C.handling*rate};myBids.add(t.id);
    }
    nextMonth();
    const active=state.rivals.filter(c=>!c.bankrupt);
    for(const c of active)for(const w of c.sites)
     if(w.contracts.filter(k=>k.start<=m&&k.end>=m).reduce((n,k)=>n+k.spaces,0)>rivalSpace(w,m))badCapacity=true;
    for(const t of auctions){
     const winner=[p,...active].find(c=>c.sites.some(w=>w.contracts.some(k=>k.id===t.id)));
     if(!winner)continue;
     if(m>72&&winner!==p)late.add(t.region);
     if(myBids.has(t.id)&&rivalOrders.has(t.id)){
      competed++;if(winner===p)playerWins++;else rivalWins++;
     }
    }
   }
   return {badCapacity,competed,playerWins,rivalWins,late:late.size,retained:state.rivals.filter(c=>original.has(c.name)).length,retired:state.retiredRivals.length};
  })()`);
  assert.equal(x.badCapacity,false,String(seed));
  assert.equal(x.retained,6,String(seed));assert.equal(x.retired,0,String(seed));assert.equal(x.late,3,String(seed));
  totalCompeted+=x.competed;totalRivalWins+=x.rivalWins;totalPlayerWins+=x.playerWins;
 }
 assert.ok(totalCompeted>=300);
 assert.ok(totalRivalWins/totalCompeted>=.22);
 assert.ok(totalPlayerWins/totalCompeted>=.22);
});
