import assert from 'node:assert/strict';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {compile,boot,setup} from './runtime.mjs';
const folder=fileURLToPath(new URL('../',import.meta.url));
const game=compile(folder);
const bin=(s=137)=>{const g=boot(game,s);setup(g);return g;};
const json=x=>JSON.parse(JSON.stringify(x));

test('queued hires, reductions and cancellations take one month and survive reload',()=>{
  let g=bin();g.run(`let w=state.player.sites[0];w.staff=2;
    staff(1);staff(1);staff(1);staff(-1);staff(-1);
    w.hs=true;save();`);
  assert.equal(g.run('w.staff'),2);
  assert.deepEqual(json(g.run('w.staffPlan')),{count:3,effective:2});
  g=boot(game,765,g.store);
  g.run('let w=state.player.sites[0];');
  assert.equal(g.run('w.staffPlan.count'),3);
  assert.equal(g.run('siteCapacity(w)'),3960);
  g.run('nextMonth()');
  assert.equal(g.run('state.player.last.labour'),5000);
  assert.equal(g.run('state.player.last.capacity'),3960);
  assert.equal(g.run('w.staff'),3);
  assert.equal(g.run('w.staffPlan'),undefined);
  g.run('staff(1); staff(-1)');
  assert.equal(g.run('w.staffPlan'),undefined);
  g.run('staff(-1); nextMonth()');
  assert.equal(g.run('state.player.last.labour'),7500);
  assert.equal(g.run('w.staff'),2);
  assert.equal(g.run('w.staffPlan'),undefined);
});

test('trucks are paid per delivered truck, shared between shifts, and require a human',()=>{
  const g=bin();
  g.run(`let w=state.player.sites[0]; w.staff=4;w.shiftStaff=[2,2,0];w.hs=true;
    dot19SetTrucks(1); dot19SetTrucks(1);dot19SetTrucks(-1);`);
  assert.equal(g.run('siteCapacity(w)'),7920);
  assert.equal(g.run('dot17SiteOpsCosts(w).mheCost'),0);
  assert.deepEqual(json(g.run('w.mhePlan')),{count:1,effective:2});
  g.run('nextMonth()');
  assert.equal(g.run('state.player.last.mheCost'),0);
  assert.equal(g.run('siteCapacity(w)'),11220);
  assert.deepEqual(json(g.run('dot19ShiftPlan(w,2).map(x=>x.mhe)')),[1,1,0]);
  assert.equal(g.run('dot17SiteOpsCosts(w).mheCost'),650);
  g.run('w.staff=0;w.shiftStaff=[0,0,0]');
  assert.equal(g.run('siteCapacity(w)'),0);
  assert.equal(g.run('dot17SiteOpsCosts(w).mheCost'),650);
  g.run('w.mheTrucks=350; w.staff=1');
  assert.equal(g.run('siteCapacity(w)'),3630);
  assert.equal(g.run('dot17SiteOpsCosts(w).mheCost'),227500);
  assert.equal(g.run(`(()=>{const s=state.rivals[0].sites[0],old=siteProductivity(s);s.mheTrucks=2;
    return siteProductivity(s)===old&&dot17Inventory(state.rivals[0],s,s.contracts,state.month,8000,8000).mheCost===0;})()`),true);
});

test('165 hours, pay premiums, and 30 per lane; shifts only count when crewed',()=>{
  const g=bin();
  g.run(`let w=state.player.sites[0];w.region='south';selected='south';w.staff=1;
    w.automationAssets=[{section:0,expires:25}];w.automated=1; w.mheTrucks=4;w.hs=true;
    dot17SetStaff(1,1);dot17SetStaff(1,2);`);
  assert.equal(g.run('siteCapacity(w)'),4950);
  assert.equal(g.run('dot19Payroll(w)'),2750);
  assert.equal(g.run('dot19ShiftCount(w)'),1);
  g.run('nextMonth()');
  assert.equal(g.run('state.player.last.labour'),2750);
  assert.equal(g.run('dot19ShiftCount(w)'),3);
  assert.equal(g.run('siteCapacity(w)'),14850);
  assert.equal(g.run('dot19Payroll(w)'),9075);
  g.run("w.ci=1.20;w.projects.push({type:'Replacement',remaining:2,section:0})");
  assert.equal(g.run('siteCapacity(w)'),7425);
  g.run('w.staff=2;w.shiftStaff=[2,0,0];w.projects=[]');
  assert.equal(g.run('siteCapacity(w)'),9306);
  assert.equal(g.run('dot19Capacity(w,25)'),8712);
});

test('legacy queued hires and section leases migrate without multiplying fleet',()=>{
  const g=bin();
  g.run(`let w=state.player.sites[0];w.staff=3;w.sections=2;w.mheLeased=true;
    w.staffPlan={count:4,effective:2};
    w.automationAssets=[{section:0,expires:25}];w.automated=1;save()`);
  const h=boot(game,987,g.store);
  h.run('let w=state.player.sites[0]');
  assert.equal(h.run('w.mheTrucks'),1);
  h.run('w.sections=3;w.hs=true;nextMonth()');
  assert.equal(h.run('w.mheTrucks'),1);
  assert.deepEqual(json(h.run('dot19Roster(w)')),[4,0,0]);
});

test('CI is available every 24 turns and only three funded starts per site',()=>{
  const g=bin();
  g.run("let w=state.player.sites[0];state.player.cash=1e6;startCI()");
  assert.equal(g.run('w.ciStarts'),1);
  assert.equal(g.run('dot19CINext(w)'),25);
  g.run('progress(state.player);progress(state.player);progress(state.player);state.month=24');
  assert.throws(()=>g.run('startCI()'), /24 turns/);
  g.run('state.month=25;startCI();w.projects=[];state.month=49;startCI();w.projects=[];state.month=74');
  assert.equal(g.run('w.ciStarts'),3);
  assert.throws(()=>g.run('startCI()'), /three programmes/);
  assert.equal(g.run('dot19CINext(w)'),Infinity);
});

test('stock manager reduces both probability and loss size, empty sites have no customer fine',()=>{
  const g=bin();
  g.run(`let w=state.player.sites[0], book=[{id:'one',spaces:2250,name:'Customer One'}];
    w.racks=8;w.staff=4;w.mheLeased=true;
    let absent=dot17Inventory(state.player,w,book,1,9000,9000,()=>.12);
    w.stockController=true;
    let covered=dot17Inventory(state.player,w,book,1,9000,9000,()=>.12);`);
  assert.equal(g.run('absent.stockLoss.customer'),'Customer One');
  assert.ok(g.run('absent.stockShortages')>0);
  assert.equal(g.run('absent.stockFines'),g.run('absent.stockShortages*350'));
  assert.equal(g.run('covered.stockFines'),0);
  assert.equal(g.run('covered.stockControlCost'),3000);
  assert.equal(g.run('covered.mheCost'),650);
  assert.equal(g.run('dot17Inventory(state.player,w,[],1,0,0,()=>{throw Error("Unexpected risk roll")}).stockFines'),0);
  assert.ok(g.run(`(()=>{let a=dot17Inventory(state.player,w,book,1,9000,9000,()=>.02);
    w.stockController=false;let b=dot17Inventory(state.player,w,book,1,9000,9000,()=>.02);
    return a.stockFines>0&&a.stockFines<b.stockFines&&a.stockShortages<b.stockShortages;})()`));
});

test('equipment, managers and fines reconcile to site profit, company profit, cash and finance UI',()=>{
  const g=bin();
  g.run(`let p=state.player,w=p.sites[0];let openingCash=p.cash;
    w.racks=8;w.staff=6;w.hs=true;
    w.contracts=[{id:'k',name:'A <customer>',start:1,end:18,spaces:2200,moves:8500,storage:16,handling:5.5}];
    w.mheLeased=true;w.stockController=true;
    Math.random=()=>.001;let r=companyMonth(p,1);
    go('history');`);
  assert.ok(g.run('r.stockFines')>0);
  assert.equal(g.run('r.stockFines'),g.run('w.last.stockFines'));
  assert.equal(g.run('r.stockShortages'),g.run('w.last.stockShortages'));
  assert.equal(g.run('r.mheCost'),650);
  assert.equal(g.run('r.stockControlCost'),3000);
  assert.ok(g.run(`Math.abs(r.profit-(r.storage+r.handling-r.rent-r.labour-r.hs-r.incidentCost-r.overflowCost-r.interest-r.management-r.mheCost-r.stockControlCost-r.stockFines-(r.facilityCost||0)))<1e-6`));
  assert.equal(g.run('r.cash'),g.run('openingCash+r.profit-r.principal'));
  assert.match(g.run('state.events[0]'), /^STOCK SHORTAGE:/);
  assert.match(g.u(),/Equipment leases/);
  assert.match(g.u(),/Stock shortage charges/);
  g.run("go('office')");
  assert.match(g.u(),/A &lt;customer&gt;/);
});
