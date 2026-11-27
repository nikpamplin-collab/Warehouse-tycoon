import assert from 'node:assert/strict';
import {test} from 'node:test';
import {compile,boot,setup} from './runtime.mjs';
const code=compile(new URL('..',import.meta.url).pathname);
function game(seed){const g=boot(code,seed);setup(g);return g;}
test('quiet advance uses the same simulation and stops at renewals and pending actions',()=>{
 const a=game(71),b=game(71);
 const prepare=`const site23=selectedSite();state.tenders=[];state.player.cash=350000;site23.hs=true;site23.staff=2;site23.contracts=[{id:'long',name:'Stable account',start:1,end:20,spaces:250,moves:600,storage:28,handling:9}];`;
 a.run(prepare);b.run(prepare);
 assert.equal(a.run('d23Signals().length'),0);
 const end=a.run('d23Advance();state.month');
 assert.ok(end>1&&end<=4);
 for(let i=1;i<end;i++)b.run('nextMonth()');
 assert.equal(a.run('JSON.stringify(state)'),b.run('JSON.stringify(state)'));
 a.run('site23.contracts[0].end=state.month+1');
 assert.match(a.run('d23Signals().join(" ")'),/Stable account ends/);
 assert.equal(a.run('d23Advance();state.month'),end);
 assert.equal(a.run('renewalTenders(state)[0].start'),end+2);
 assert.equal(a.run('renewalTenders(state).length'),0);
});
test('rival styles favour different work without exposing their tender rates',()=>{
 const a=game(14);
 const styles=a.run('state.rivals.map(c=>d23Type(c).label)');
 assert.equal(new Set(styles).size,3);
 assert.equal(a.run("d23RivalOffer(state.rivals[0],{region:state.rivals[0].sites[0].region,term:24}).price<d23RivalOffer(state.rivals[0],{region:'xxx',term:24}).price"),true);
 assert.equal(a.run("d23RivalOffer(state.rivals[1],{term:18,variableVolume:true}).strength>d23RivalOffer(state.rivals[2],{term:18,variableVolume:true}).strength"),true);
 assert.doesNotMatch(a.run('d23PublicRivals()'),/£/);
});
