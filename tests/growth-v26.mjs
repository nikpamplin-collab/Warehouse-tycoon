import assert from 'node:assert/strict';
import {test} from 'node:test';
import {compile,boot,setup} from './runtime.mjs';
const code=compile(new URL('..',import.meta.url).pathname);
const play=(seed=91,store)=>{const g=boot(code,seed,store);if(!store)setup(g);return g;};
test('starter loans are available in month one, finite, amortising and not reusable',()=>{
 const g=play();
 assert.equal(g.run('v18LoanOffer(state.player).available'),0);
 assert.equal(g.run('d26StarterAvailable(state.player)'),100000);
 g.run('state.player.cash=-30000;d26BorrowStarter()');
 assert.equal(g.run('state.player.cash'),-5000);
 g.run('for(let i=0;i<9;i++)d26BorrowStarter()');
 assert.equal(g.run('state.player.debt'),100000);
 assert.equal(g.run('state.player.cash'),70000);
 assert.equal(g.run('state.player.loans.reduce((n,l)=>n+l.payment,0)'),3133.64);
 g.run('repay()');
 assert.equal(g.run('state.player.debt'),75000);
 assert.equal(g.run('d26StarterAvailable(state.player)'),0);
 const fresh=play();fresh.run('state.month=13');assert.equal(fresh.run('d26StarterAvailable(state.player)'),0);
});
test('extension stays £1m; loan requires six profitable months and funds only the build',()=>{
 const g=play();
 g.run('state.player.cash=400000;state.player.history=Array.from({length:5},()=>({profit:20000}))');
 assert.equal(g.run('d26MortgageOffer(selectedSite()).streak'),5);
 g.run('d26TakeMortgage()');assert.equal(g.run('state.player.debt'),0);
 g.run('state.player.history.push({profit:-100})');
 assert.equal(g.run('d26MortgageOffer(selectedSite()).streak'),0);
 g.run('state.player.history=Array.from({length:6},()=>({profit:15000,spotRevenue:15000}))');
 assert.equal(g.run('d26MortgageOffer(selectedSite()).available'),false);
 g.run('state.player.history.forEach(r=>r.spotRevenue=0);state.player.cash=250000');
 assert.equal(g.run('d26MortgageOffer(selectedSite()).available'),false);
 g.run('state.player.cash=400000;d26TakeMortgage();d26TakeMortgage()');
 assert.equal(g.run('state.player.debt'),750000);
 assert.equal(g.run('state.player.cash'),150000);
 assert.equal(g.run('selectedSite().projects.length'),1);
 assert.equal(g.run('selectedSite().projects[0].cost'),1000000);
 assert.equal(g.run('selectedSite().projects[0].remaining'),6);
 assert.equal(g.run('state.player.loans[0].months'),300);
 assert.equal(g.run('state.player.loans[0].payment'),5788.62);
 assert.equal(g.run('v18OwnedValue(state.player)'),0);
 assert.throws(()=>g.run('cancelProject(0)'),/cannot be cancelled/);
 assert.deepEqual(Array.from(g.run('(()=>{const r=v18LoanPayment(state.player);return [r.interest,r.principal]})()')),[5000,788.62]);
 g.run('for(let i=0;i<6;i++)progress(state.player)');
 assert.equal(g.run('selectedSite().sections'),2);
 assert.equal(g.run('v18OwnedValue(state.player)'),1000000);
 assert.equal(g.run('DOT17Facilities.doorCount(selectedSite())'),3);
 g.run('for(let i=1;i<300;i++)v18LoanPayment(state.player)');
 assert.equal(g.run('state.player.debt'),0);
});
test('racking and dock capacity are together; neither changes until the order completes',()=>{
 const g=play();
 g.run("go('investment')");
 assert.match(g.u(),/Racking &amp; docks/);assert.match(g.u(),/Buy racking/);
 assert.match(g.u(),/Dock doors ready<\/span><strong>2/);
 g.run("orderWarehouseFacility('dock')");
 assert.match(g.u(),/Dock doors ready<\/span><strong>2/);
 assert.equal(g.run('d21OpsModel(selectedSite(),[1,0,0],0).bays'),3);
 g.run("nextMonth(true);go('investment')");
 assert.match(g.u(),/Dock doors ready<\/span><strong>3/);
 g.run("go('warehouse')");
 assert.doesNotMatch(g.u().match(/id="d21-site-safety"[\s\S]*?<\/section>/)?.[0]??'',/dock doors/i);
});
test('v25 save imports without being overwritten and challenge funding stays unchanged',()=>{
 const legacy=play().run('JSON.stringify(state)');
 const store=new Map([['warehouse_tycoon_dotv25',legacy]]);
 const g=play(93,store);assert.equal(g.run('state.player.name'),'Amber Pallet Co');
 g.run('d26BorrowStarter()');assert.ok(store.get('warehouse_tycoon_dotv27'));
 assert.equal(store.get('warehouse_tycoon_dotv25'),legacy);
 const mode=boot(code,91);mode.el('d25-mode').value='cash';setup(mode);
 assert.equal(mode.run('d26StarterAvailable(state.player)'),0);
 assert.equal(mode.run('d26MortgageOffer(selectedSite()).available'),false);
});
test('free play can finance growth through regular bidding, trading and saving',()=>{
 for(const seed of [31,41,51]){
  const g=play(seed);
  const result=g.run(`(()=>{
   const c=state.player,s=selectedSite();let financed=0;
   for(let m=1;m<=36&&!state.finished;m++){
    if(m===1){d26BorrowStarter();for(let i=0;i<5;i++)buyRack();hs();dot17ToggleSiteOps('stock');}
    if(m===2)for(let i=0;i<4;i++)buyRack();
    if(financed&&m===financed+6)for(let i=0;i<5;i++)buyRack();
    const tenders=state.tenders.filter(t=>availableSite(c,t)&&t.region==='mid').sort((a,b)=>b.spaces-a.spaces);
    const live=contracts(s,m+1);
    let booked=live.reduce((a,k)=>a+k.spaces,0),moves=live.reduce((a,k)=>a+k.moves,0);
    for(const t of tenders){
     if(t.spot||t.spaces+booked>siteSpace(s))continue;
     state.bids[t.id]={storage:11,handling:4.25};booked+=t.spaces;moves+=t.moves;
    }
    const n=Math.max(1,Math.ceil(moves/2900));
    s.staffPlan={count:n,shifts:[Math.min(n,5),Math.max(0,n-5),0],effective:m+1};
    s.mhePlan={count:n,effective:m+1};
    const q=d26MortgageOffer(s);
    if(!financed&&q.available&&c.cash>=q.deposit+q.reserve+75000){financed=m;d26TakeMortgage();}
    nextMonth(true);
   }
   return {financed,month:state.month,cash:c.cash,sections:s.sections};
  })()`);
  assert.ok(result.financed>=7&&result.financed<=30,JSON.stringify(result));
  assert.equal(result.month,37);
  assert.equal(result.sections,2);
  assert.ok(result.cash>0,JSON.stringify(result));
 }
});

