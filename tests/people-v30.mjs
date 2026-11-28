import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {boot,compile,setup} from './runtime.mjs';
const script=compile(fileURLToPath(new URL('..',import.meta.url)));
const newGame=()=>{const g=boot(script);setup(g);g.run('const s=selectedSite()');return g;};
const val=(g,code)=>JSON.parse(g.run('JSON.stringify('+code+')'));
test('month and role pools are stable, distinct, and favour availability and salaries in a downturn',()=>{
 const g=newGame();
 for(const role of ['ops','safety','stock']){
  const expression='DOT30People.pool(state,s,'+JSON.stringify(role)+')';
  g.run("state.economy.phase='bust'");const low=val(g,expression);
  assert.deepEqual(val(g,expression),low);
  g.run("state.economy.phase='boom'");const high=val(g,expression);
  assert.equal(low.length,5);assert.equal(high.length,4);
  const skill=p=>p.people??p.skill;
  assert.ok(low.filter(p=>skill(p)>=8).length>high.filter(p=>skill(p)>=8).length);
  const impliedSalary=group=>group.reduce((a,p)=>a+p.salary,0)/group.length;
  assert.ok(impliedSalary(low)<impliedSalary(high),role+' salary');
  for(const p of [...low,...high])for(const x of role==='ops'?['experience','people','safety','stock']:['experience','skill'])assert.ok(p[x]>=1&&p[x]<=10);
 }
});
test('confirmed appointments use agreed salary once, retain historical incumbent pay and prevent repeat application',()=>{
 const g=newGame();g.run('s.managers=1;s.hs=true;s.stockController=true;state.player.cash=999999');
 assert.deepEqual(val(g,"[managementCost(state.player),DOT30People.salary(s,'stock'),DOT30People.salary(s,'safety')]"),[5000,3000,4000]);
 g.run(`const ops=DOT30People.pool(state,s,'ops')[0], stock=DOT30People.pool(state,s,'stock')[0], safety=DOT30People.pool(state,s,'safety')[0];
  DOT30People.hire(state,s,'ops',ops.id);DOT30People.hire(state,s,'stock',stock.id);DOT30People.hire(state,s,'safety',safety.id);`);
 assert.equal(g.run('s.managers'),2);
 assert.equal(g.run("DOT30People.hire(state,s,'ops',ops.id)"),false);
 assert.equal(g.run('state.player.cash'),999999);
 assert.deepEqual(val(g,'DOT30People.team(s).map(x=>x.role).sort()'),['ops','ops','safety','safety','stock','stock']);
 assert.equal(g.run('managementCost(state.player)'),g.run('5000+ops.salary'));
 const totals=val(g,`(()=>{const r=companyMonth(state.player,state.month);return [r.management,r.hs,r.stockControlCost]})()`);
 assert.deepEqual(totals,val(g,'[5000+ops.salary,4000+safety.salary,3000+stock.salary]'));
 g.run("DOT30People.release(state,s,'stock',stock.id)");
 assert.equal(g.run("DOT30People.salary(s,'stock')"),3000);
 assert.equal(g.run('s.stockController'),true);
 g.run("DOT30People.release(state,s,'stock','legacy-stock-0')");
 assert.equal(g.run("DOT30People.salary(s,'stock')"),0);
 assert.equal(g.run('s.stockController'),false);
});
test('mood is gradual, affects manual and automated capacity, and is not reset by changing managers',()=>{
 const g=newGame();g.run(`state.economy.phase='boom';const weak=DOT30People.pool(state,s,'ops').sort((a,b)=>a.people-b.people)[0];
 DOT30People.hire(state,s,'ops',weak.id);s.staff=3;s.shiftStaff=[3,0,0];s.automationAssets=[{section:0,commissioned:1,expires:120}];`);
 const base=g.run('siteCapacity(s)');
 g.run(`for(let m=1;m<=8;m++)DOT30People.record(s,m,{handled:1800,demand:2000});`);
 assert.ok(g.run('DOT30People.mood(s)')<6);
 assert.ok(g.run('siteCapacity(s)')<base);
 assert.notEqual(g.run('s.peopleMoodTrend'),1);
 const mood=g.run('DOT30People.mood(s)');
 g.run(`DOT30People.release(state,s,'ops',weak.id);state.month++;state.economy.phase='bust';
 const good=DOT30People.pool(state,s,'ops').sort((a,b)=>b.people-a.people)[0];DOT30People.hire(state,s,'ops',good.id);`);
 assert.equal(g.run('DOT30People.mood(s)'),mood);
 g.run("DOT30People.record(s,9,{handled:1800,demand:2000})");
 assert.ok(g.run('DOT30People.mood(s)')>mood);
});
test('Ops ratings affect frequency; strong specialists reduce odds and severity further',()=>{
 const g=newGame();
 g.run(`const ops=DOT30People.pool(state,s,'ops')[0];DOT30People.hire(state,s,'ops',ops.id);
 Object.assign(s.peopleHires[0],{safety:10,stock:10,experience:10});`);
 const got=val(g,'DOT30People.influence(s)');assert.ok(got.safetyOdds<.4);assert.ok(got.stockOdds<1);
 assert.equal(got.safetySeverity,1);assert.equal(got.stockSeverity,1);
 g.run(`for(const role of ['safety','stock']){
  const p=DOT30People.pool(state,s,role).at(-1);DOT30People.hire(state,s,role,p.id);
  Object.assign(s.peopleHires.find(x=>x.role===role),{skill:10,experience:10});
 }`);
 const protectedSite=val(g,'DOT30People.influence(s)');
 for(const x of ['safetyOdds','stockOdds','safetySeverity','stockSeverity'])assert.ok(protectedSite[x]<got[x]);
 assert.equal(g.run("DOT20Fire.incidentKind(s,.09)"),null);
 assert.equal(g.run("DOT30People.safetySeverity(s,.85)"),'Medium');
});
test('employee records separate site observations, severity and a matched productivity baseline',()=>{
 const g=newGame();g.run(`s.staff=3;s.shiftStaff=[3,0,0];
 for(let m=1;m<=3;m++)DOT30People.record(s,m,{demand:5000,handled:4000});
 state.month=4;
 for(const role of ['ops','safety','stock'])DOT30People.hire(state,s,role,DOT30People.pool(state,s,role)[0].id);
 for(let m=4;m<=6;m++)DOT30People.record(s,m,{demand:5100,handled:4200,stockLoss:m===5?{pallets:8}:null});
 DOT30People.record(s,7,{demand:5100,handled:4000,incident:{severity:'Medium'}});
 DOT30People.record(s,7,{demand:5100,handled:4000,incident:{severity:'Large'}});`);
 const [ops,safety,stock]=val(g,'s.peopleHires.map(p=>p.stats)');
 assert.equal(ops.months,4);assert.equal(ops.compare,3);assert.ok(Math.abs(ops.afterMoves/ops.beforeMoves-1.05)<1e-6);
 assert.equal(safety.safety,1);assert.equal(safety.worstSafety,'Medium');assert.equal(safety.stock,undefined);
 assert.equal(stock.stock,1);assert.equal(stock.worstStock,8);assert.equal(stock.safety,undefined);
});

test('multiple hires are additive and capable colleagues compound; weak recruits can dilute quality',()=>{
 for(const role of ['ops','safety','stock']){
  const g=newGame();
  g.run(`const role=${JSON.stringify(role)};const picks=DOT30People.pool(state,s,role);
   const hire=i=>DOT30People.hire(state,s,role,picks[i].id);
   const set=(p,n)=>Object.assign(p,{people:n,safety:n,stock:n,skill:n,experience:n});
   const a=hire(0);set(a,8);`);
  const expensive=g.run('DOT30People.salary(s,role)');
  const measure=role==='safety'?'safetyOdds':'stockOdds';
  const single=val(g,'DOT30People.influence(s)')[measure];
  g.run('const b=hire(1);set(b,8);');
  assert.equal(g.run('DOT30People.team(s).length'),2);
  assert.equal(g.run('DOT30People.salary(s,role)'),expensive+g.run('b.salary'));
  const paired=val(g,'DOT30People.influence(s)')[measure];assert.ok(paired<single,role);
  g.run('set(b,1)');
  assert.ok(val(g,'DOT30People.influence(s)')[measure]>single,role+' dilution');
  g.run('DOT30People.release(state,s,role,b.id)');
  assert.equal(g.run('DOT30People.team(s).length'),1);
  assert.equal(g.run('DOT30People.salary(s,role)'),expensive);
 }
});
