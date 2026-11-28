/* DOTv20: staged warehouse fire protection. Pure view functions; explicit project lifecycle. */
(() => {
 'use strict';
 const WATER='Tank and pumps', ROOF='Roof sprinklers', RACK='In-rack sprinklers', LEGACY='Sprinklers';
 const types=Object.freeze([WATER,ROOF,RACK]);
 const months=Object.freeze({[WATER]:2,[ROOF]:2,[RACK]:1,[LEGACY]:2});
 const cash=n=>'£'+Math.round(n).toLocaleString('en-GB');
 const n=x=>Number.isSafeInteger(x)&&x>=0?x:0;
 const sections=s=>Math.max(1,n(s?.sections));
 const rackable=s=>Math.min(sections(s),Math.ceil(n(s?.racks)/9));
 const queued=(s,type)=>(s?.projects||[]).find(p=>p.type===type);
 function footprint(s) {
  if(!s?.fireProtection && s?.facilitySprinklers===true) {
   return {water:sections(s),roof:sections(s),rack:0};
  }
  const x=s?.fireProtection;
  const water=Math.min(sections(s),n(x?.water));
  const roof=Math.min(water,n(x?.roof));
  return {water,roof,rack:Math.min(roof,rackable(s),n(x?.rack))};
 }
 function migrate(s) {
  if(!s) return;
  if(!s.fireProtection&&s.facilitySprinklers===true) s.fireProtection=footprint(s);
  delete s.facilitySprinklers;
 }
 function quote(s,type) {
  if(!s||!types.includes(type)) return null;
  const x=footprint(s);
  let goal=0,added=0,cost=0,reason='';
  if(queued(s,LEGACY)) reason='Existing sprinkler project already under way';
  if(type===WATER){
   goal=sections(s);added=goal-x.water;
   cost=(x.water?0:35000)+5000*added;
   reason ||= added===0?'Water supply sized for the entire site':'';
  } else if(type===ROOF){
   goal=x.water;added=goal-x.roof;cost=38000*added;
   reason ||= !x.water?'Get the tank and pumps ready first':added===0?'Roof sprinklers already cover all areas served by the water supply':'';
  } else {
   goal=Math.min(x.roof,rackable(s));added=goal-x.rack;cost=20000*added;
   reason ||= !x.water?'Get the tank and pumps ready first':!x.roof?'Commission roof sprinklers first':!rackable(s)?'Install racking first':added===0?'Existing racking inside the roof-covered sections is protected':'';
  }
  if(queued(s,type)) reason='Already in the project queue';
  return {type,available:!reason&&added>0,cost:added>0?cost:0,months:months[type],goal,added,reason};
 }
 function order(s,company,type){
  const q=quote(s,type);
  if(!q?.available||!company||!Number.isFinite(company.cash)||company.cash<q.cost) return false;
  migrate(s);
  company.cash-=q.cost;
  s.projects.push({type,remaining:q.months,cost:q.cost,fireGoal:q.goal});
  return true;
 }
 function complete(s,p) {
  if(!s||!p||(!types.includes(p.type)&&p.type!==LEGACY)) return false;
  migrate(s);
  const x=footprint(s);
  if(p.type===LEGACY){
   x.water=Math.max(x.water,sections(s));x.roof=Math.max(x.roof,sections(s));
  } else if(p.type===WATER){
   x.water=Math.max(x.water,Math.min(sections(s),n(p.fireGoal)));
  } else if(p.type===ROOF){
   x.roof=Math.max(x.roof,Math.min(x.water,n(p.fireGoal)));
  } else {
   x.rack=Math.max(x.rack,Math.min(x.roof,rackable(s),n(p.fireGoal)));
  }
  s.fireProtection=x;
  return true;
 }
 // Keep the old H&S-sensitive probability of ignition. Mitigation changes the
 // size of a fire loss only. A dry pump installation never prevents a fire.
 const incidentRisk=s=>DOT30People.influence(s).safetyOdds;
 function fireRisk(s){return incidentRisk(s)*.12;}
 function incidentKind(s,roll){
  return roll<fireRisk(s)?'Fire':roll<incidentRisk(s)?'Safety':null;
 }
 function outcome(s,baseCost,baseDisruption){
  const x=footprint(s), divisor=sections(s);
  const mitigation=.55*x.roof/divisor+.25*x.rack/divisor;
  return {cost:Math.round(baseCost*(1-mitigation)),disruption:baseDisruption*(1-mitigation),mitigation};
 }
 function runningCost(s){
  const x=footprint(s);
  return (x.water?120:0)+x.roof*60+x.rack*50;
 }
 function view(s){
  const x=footprint(s);
  return {...x,sections:sections(s),waterWorks:!!queued(s,WATER),roofWorks:!!queued(s,ROOF)||!!queued(s,LEGACY),rackWorks:!!queued(s,RACK)};
 }
 function shortStatus(s){
  const x=view(s), previous=s?.last?.incident;
  const assets=x.water?('Water supply ready · roof '+x.roof+'/'+x.sections+' · in-rack '+x.rack+'/'+rackable(s)):(x.waterWorks?'Tank and pumps being installed':'No fire protection ready to use');
  const note=previous?.kind==='Fire'?' · Fire last month':'';
  return '<div class="'+(x.roof?'d17-facility-added':'')+'"><strong>Fire protection</strong><span>'+assets+'</span><span>Sprinklers reduce fire damage, not the chance of a fire'+note+'</span></div>';
 }
 function controls(s,balance){
  const x=view(s), cost=runningCost(s);
  const action=types.map((t,i)=>{
   const q=quote(s,t), ids=['tank','roof','rack'];
   const held=i===0?x.water:i===1?x.roof:x.rack;
   const possible=i===2?rackable(s):x.sections;
   return '<article class="d20-fire-stage"><div><b>'+(i+1)+'. '+t+'</b><small>'+held+'/'+possible+' sections ready to use'+(q.cost?' · '+cash(q.cost)+' · '+q.months+' month'+(q.months===1?'':'s'):'')+'</small></div>'
     +'<button class="btn secondary" '+(!q.available||balance<q.cost?'disabled ':'')+'onclick="orderFireProtection(\''+ids[i]+'\')">Order '+t.toLowerCase()+'</button>'
     +(!q.available?'<p class="muted">'+q.reason+'</p>':'')+'</article>';
  }).join('');
  return '<section class="d20-fire-controls" aria-label="Staged fire protection"><h3>Fire protection</h3>'
   +'<p>Commission the outside tank and pumps first, then protect the roof and add in-rack cover where needed. Existing coverage remains in service while new work is fitted.</p>'
   +action+'<p class="muted">Current inspections and servicing: '+cash(cost)+'/month. Roof and in-rack sprinklers reduce damage and disruption, not the chance of a fire.</p></section>';
 }
 window.DOT20Fire=Object.freeze({WATER,ROOF,RACK,LEGACY,types,months,footprint,migrate,quote,order,complete,fireRisk,incidentKind,outcome,runningCost,view,shortStatus,controls});
})();
