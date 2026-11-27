import assert from 'node:assert/strict';
import {test} from 'node:test';
import {compile,boot,setup} from './runtime.mjs';
const code=compile(new URL('..',import.meta.url).pathname);
function challenge(kind,seed=21){const g=boot(code,seed);g.el('d25-mode').value=kind;setup(g);return g;}
test('three scenarios have unique, attainable targets under existing trading rules',()=>{
 const cash=challenge('cash',11),idle=challenge('cash',11);
 cash.run(`for(let i=1;i<=8&&!state.finished;i++){const s=selectedSite();s.stockController=true;if(i===4){s.staffPlan={count:3,shifts:[3,0,0],effective:5};s.mhePlan={count:2,effective:5};}nextMonth(true);}`);
 idle.run('for(let i=1;i<=8&&!state.finished;i++)nextMonth(true)');
 assert.equal(cash.run('state.challenge.result.won'),true);
 assert.equal(idle.run('state.challenge.result.won'),false);
 const peak=challenge('peak',21);
 peak.run(`for(let i=1;i<=6&&!state.finished;i++){const s=selectedSite();s.stockController=true;if(i===2){s.staffPlan={count:5,shifts:[3,2,0],effective:3};s.mhePlan={count:3,effective:3};}nextMonth(true);}`);
 assert.equal(peak.run('state.challenge.result.won'),true);
 const region=challenge('region',21);
 region.run(`for(let m=1;m<=10&&!state.finished;m++){
  for(const s of state.player.sites){s.stockController=true;const demand=contracts(s,m+1).reduce((a,k)=>a+k.moves,0),n=Math.max(2,Math.ceil(demand/1720));s.staffPlan={count:n,shifts:[Math.min(n,4),Math.max(0,n-4),0],effective:m+1};s.mhePlan={count:Math.max(0,n-2),effective:m+1};}
  const t=state.tenders.filter(t=>t.region==='north'&&!t.spot&&availableSite(state.player,t)).sort((a,b)=>(b.spaces*12+b.moves*4.2)-(a.spaces*12+a.moves*4.2))[0];
  if(t)state.bids[t.id]={storage:12,handling:4.2};nextMonth(true);
 }`);
 assert.equal(region.run('state.challenge.result.won'),true);
 assert.match(region.run('d25Challenge()'),/Target met/);
 const recorded=region.run('JSON.stringify(state.challenge.result)');region.run('nextMonth(true)');
 assert.equal(region.run('JSON.stringify(state.challenge.result)'),recorded);
});
test('v25 imports v21 data and does not overwrite the live save or its rollback state',()=>{
 const legacy=challenge('cash',2).run('JSON.stringify(state)');
 const store=new Map([['warehouse_tycoon_v11',legacy]]);
 const a=boot(code,9,store);assert.equal(a.run('state.player.name'),'Amber Pallet Co');
 a.run('nextMonth();state.player.cash+=2500;save()');
 assert.equal(store.get('warehouse_tycoon_v11'),legacy);
 const b=boot(code,9,store);assert.equal(b.run('state.month'),2);
 assert.notEqual(store.get('warehouse_tycoon_dotv25'),legacy);
});
test('fit shortlist keeps placed bids and is read-only',()=>{
 const a=challenge('region');const before=a.run('JSON.stringify(state)');
 a.run("d25SetFilter('fit')");
 assert.ok(a.run('d25Tenders().every(t=>availableSite(state.player,t)||state.bids[t.id])'));
 assert.equal(a.run('JSON.stringify(state)'),before);
 assert.match(a.run('d25FilterToolbar()'),/Storage fits my sites/);
});
test('three-year lean depot and multi-site specialists can both trade profitably',()=>{
 for(const [kind,sites] of [['peak',1],['region',2]])for(const seed of [11,21,31]){
  const g=challenge(kind,seed);
  g.run(`for(let m=1;m<=36&&!state.finished;m++){
   for(const s of state.player.sites){s.stockController=true;const moves=contracts(s,m+1).reduce((a,k)=>a+k.moves,0);
    const n=Math.min(12,Math.max(2,Math.ceil(moves/2900)));s.staffPlan={count:n,shifts:[Math.min(n,3),Math.max(n-3,0),0],effective:m+1};
    s.mhePlan={count:n,effective:m+1};
    const t=state.tenders.filter(t=>t.region===s.region&&availableSite(state.player,t)).sort((a,b)=>Number(!!b.spot)-Number(!!a.spot)||b.spaces-a.spaces)[0];
    if(t)state.bids[t.id]=t.spot?{storage:18,handling:6.25}:{storage:11.5,handling:4.25};
   }
   nextMonth(true);
  }`);
  assert.equal(g.run('state.month'),37);
  assert.equal(g.run('state.player.sites.length'),sites);
  assert.ok(g.run('rolling(state.player).profit>0 && state.player.cash>0'));
 }
});
