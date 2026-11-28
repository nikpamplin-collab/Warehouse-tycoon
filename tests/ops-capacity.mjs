import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {boot,compile,setup} from './runtime.mjs';
const script=compile(fileURLToPath(new URL('..',import.meta.url)));
function start(roster,moves){
 const g=boot(script);setup(g);
 g.run(`const s=selectedSite(),roster=${JSON.stringify(roster)};Object.assign(s,{sections:1,racks:9,staff:roster.reduce((n,x)=>n+x,0),shiftStaff:roster,mheTrucks:0,automationAssets:[],projects:[],ci:1});delete s.staffPlan;delete s.mhePlan;s.contracts=[{start:state.month,end:state.month+6,spaces:2400,moves:${moves}}];D21.drafts.clear();`);
 return g;
}
const rendered=g=>g.run('d27OpsPanel(s)');
const hasRow=(html,forecast,capacity,status)=>assert.match(html,new RegExp('Pallet handling[\\s\\S]*?</th><td>'+forecast+'</td><td>'+capacity+'</td><td><span class="d27-chip [^"]+">'+status+'</span>'));
const note=/imbalance in shift staffing/;
test('mixed dock and labour limits show actual capacity and flag the shift imbalance',()=>{
 const g=start([6,1,0],12000), before=g.run('JSON.stringify(state)');
 const html=rendered(g);hasRow(html,'12,000','11,880','Breach');
 assert.match(html,/<\/table><p class="d29-shift-warning" role="status">An imbalance in shift staffing/);
 assert.match(g.run("D27.info.get('handling').detail"),/Before dock limits, crew and kit could handle 13,860 moves/);
 assert.equal(g.run('JSON.stringify(state)'),before);
 g.run('d21Draft(s).roster=[5,2,0]');
 const balanced=rendered(g);hasRow(balanced,'12,000','13,860','Safe');assert.doesNotMatch(balanced,note);
 assert.equal(g.run('JSON.stringify(state)'),before);
});
test('single bottlenecks and a covered forecast do not misdiagnose a shift imbalance',()=>{
 for(const [roster,moves,forecast,cap,status] of [
  [[6,0,0],12000,'12,000','9,900','Breach'],
  [[1,1,0],12000,'12,000','3,960','Breach'],
  [[6,1,0],1000,'1,000','11,880','Safe'],
  [[0,0,0],1000,'1,000','0','Breach'],
 ]){
  const html=rendered(start(roster,moves));hasRow(html,forecast,cap,status);assert.doesNotMatch(html,note);
 }
});
