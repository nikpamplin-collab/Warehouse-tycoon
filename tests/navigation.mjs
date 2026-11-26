import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {boot,compile,setup} from './runtime.mjs';
const src=fileURLToPath(new URL('..',import.meta.url));
const open=()=>{
 const g=boot(compile(src));setup(g);return g;
};
const move=(g,dest)=>g.run(`goFromNav('${dest}')`);
const zone=(g,id,index)=>{
 let prevented=false;
 g.el(id).scrollIntoView=()=>{};
 g.events.get('click')({target:{closest:selector=>selector==='a[data-d15-open-site]'?{
  dataset:{d15OpenSite:String(index)},hash:'#'+id
 }:null},button:0,preventDefault:()=>{prevented=true;}});
 assert.equal(prevented,true);
};
test('Operations has day-to-day actions, Investment has capital, and Finances has results',()=>{
 const g=open(),before=g.run('JSON.stringify(state)');
 const rendered=g.el('tabs').innerHTML;
 for(const label of ['Office','Operations','Investment','Tenders','Rivals','Finances'])assert.match(rendered,new RegExp('>'+label+'</button>'));
 move(g,'warehouse');
 assert.match(g.u(),/id="d15-operations"/);
 assert.match(g.u(),/id="d15-staff"/);
 assert.doesNotMatch(g.u(),/Borrow £25k|Appraise expansion|Automation asset register|onclick="openRegion/);
 move(g,'investment');
 assert.match(g.u(),/Borrow £25k/);
 assert.match(g.u(),/Appraise expansion/);
 assert.match(g.u(),/Automation asset register/);
 assert.doesNotMatch(g.u(),/onclick="staff\(|id="d15-staff"/);
 move(g,'history');
 assert.match(g.u(),/Banking &amp; investment/);
 assert.match(g.u(),/Trading &amp; cash/);
 assert.doesNotMatch(g.u(),/Borrow £25k/);
 assert.equal(g.run('JSON.stringify(state)'),before);
});
test('Office and warehouse zone shortcuts preserve site and route to the correct screen',()=>{
 const g=open();
 g.run("state.player.sites.push(site('north'));state.player.sites[1].name='North DC'");
 const before=g.run('JSON.stringify(state)');
 zone(g,'d15-investment',1);
 assert.equal(g.run('tab'),'investment');
 assert.match(g.u(),/North DC/);
 zone(g,'d15-staff',1);
 assert.equal(g.run('tab'),'warehouse');
 assert.match(g.u(),/North DC/);
 zone(g,'d15-projects',1);
 assert.equal(g.run('tab'),'investment');
 assert.match(g.u(),/id="d15-projects"/);
 g.run('openMapSite(0)');
 assert.equal(g.run('selected'),'mid');
 assert.equal(g.run('tab'),'warehouse');
 assert.equal(g.run('JSON.stringify(state)'),before);
});
test('Unoccupied territories offer opening only in Investment; bank controls remain functional',()=>{
 const g=open();
 move(g,'warehouse');g.run("pickRegion('south')");
 assert.match(g.u(),/Explore opening a site/);
 assert.doesNotMatch(g.u(),/onclick="openRegion/);
 g.run("goFromContext('investment')");
 assert.match(g.u(),/Open 25,000 sq ft site/);
 assert.equal(g.run('selected'),'south');
 const cash=g.run('state.player.cash');
 g.run('borrow()');assert.equal(g.run('state.player.cash'),cash+25000);
 g.run('repay()');assert.equal(g.run('state.player.cash'),cash);
});
