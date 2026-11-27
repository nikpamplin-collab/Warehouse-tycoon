/* DOTv21 presentation: previews reuse DOTv20 rules. No save-schema changes. */
const D21 = {
  drafts:new Map(), upgrade:'storage', showMath:true, panels:new Map(), renderedTab:null,
  paths:{office:'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15m6-12v15',warehouse:'M3 20V9l9-5 9 5v11H3Zm4 0v-9h10v9M7 14h10m-10 3h10',market:'M6 3h8l4 4v14H6zM14 3v5h4m-9 4h6m-6 4h6',investment:'M4 20h16M5 16l5-6 4 3 5-8m-5 0h5v5',history:'M4 5h16v14H4zM8 14v2m4-5v5m4-8v8'}
};
const d21Icon=k=>'<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="'+D21.paths[k]+'"/></svg>';
const d21Delta=(n,f=num)=>n===0?'No change':(n<0?'−':'+')+f(Math.abs(n));
const d21Turns=n=>n===1?'Ready next month':'Ready in '+n+' months';
const d21Why=(body)=>'<details class="d21-why" data-fold="math" '+(D21.showMath?'open':'')+' ontoggle="if(this.isConnected)D21.showMath=this.open"><summary>Why it changes</summary><p>'+body+'</p></details>';
const d21Fold=(id,title,caption,body)=>'<details class="d21-fold" data-fold="'+id+'" '+(D21.panels.get(tab+':'+id)?'open':'')+'><summary><b>'+title+'</b><span>'+caption+'</span></summary>'+body+'</details>';
const d21Section=(no,title)=>'<h2 class="d21-section"><span>'+no+'</span>'+title+'</h2>';
const d21Yard='<svg class="d21-yard" viewBox="0 0 180 90" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="m3 64 69-17 105 20-69 20L3 64Z" stroke-dasharray="3 4"/><path d="m21 58 58 11 75-20V23L95 12 21 31v27Zm0-27 58 12 75-20M79 69V43m8 22V49l13-3v16m8-2V43l14-4v17m9-3V37l14-4v16M31 58V43l11 2v15m6 1V46l11 2v15m6 0V49l8 1v15"/></svg>';
function d21Banner(title,s,planning) {
 const region=regionOf(s?.region||selected);
 const options=regions.map(r=>'<optgroup label="'+esc(r.name)+'">'+(owned(state.player,r.id).map(x=>'<option value="'+esc(x.id)+'" '+(s===x?'selected':'')+'>'+esc(x.name)+'</option>').join('')||'<option value="region:'+r.id+'" '+(!s&&selected===r.id?'selected':'')+'>'+esc(r.name)+' · no site</option>')+'</optgroup>').join('');
 return '<div class="d21-banner">'+d21Yard+'<span class="d21-kicker">'+esc(region.name)+' / WAREHOUSE NETWORK</span><h2 tabindex="-1" id="d17-screen-title">'+title+'</h2><select aria-label="Choose a warehouse or region" onchange="d21Choose(this.value)">'+options+'</select></div>';
}
function d21Choose(v){D21.racks=1;if(v.startsWith('region:'))pickRegion(v.slice(7));else {let s=state.player.sites.find(x=>x.id===v);if(s){selected=s.region;pickSite(s.id);}}}
function d21Header(){
 const c=state.player;
 document.querySelector('header h1').textContent=c.name;
 document.getElementById('headline').textContent=monthName(state.month)+' · '+(state.finished?'Bankrupt':'Month '+state.month);
 document.getElementById('metrics').innerHTML='<div class="metric"><label>Available cash</label><strong>'+cash(c)+'</strong></div>';
 const names=[['office','Map'],['warehouse','Ops'],['market','Bids'],['investment','Invest'],['history','Cash']];
 document.getElementById('tabs').innerHTML=names.map(([k,v])=>'<button aria-current="'+(tab===k||(k==='office'&&tab==='rivals')?'page':'false')+'" class="'+(tab===k||(k==='office'&&tab==='rivals')?'active':'')+'" id="d17-nav-'+k+'" onclick="goFromNav(\''+k+'\')">'+d21Icon(k)+'<span>'+v+'</span></button>').join('');
}
function d21Projection(s, extra=[]) {
 const out={...s,projects:[...s.projects,...extra].map(p=>({...p})),automationAssets:(s.automationAssets||[]).map(a=>({...a})),fireProtection:s.fireProtection?{...s.fireProtection}:undefined};
 for(const p of out.projects.filter(p=>p.remaining<=1)){
  if(p.type==='Racking')out.racks++;
  if(p.type==='Expansion')out.sections++;
  DOT17Facilities.complete(out,p.type,p);
 }
 return out;
}
function d21Storage(s, extra=[]) {
 const p=d21Projection(s,extra), m=state.month+1;
 for(const j of p.projects.filter(j=>j.remaining<=1)) {
  if(j.type==='Automation'&&j.section!==undefined&&!assetFor(p,j.section))
   p.automationAssets.push({section:j.section,commissioned:m,expires:m+AUTO_LIFE});
  if(j.type==='Replacement'){
   const a=assetFor(p,j.section);
   if(a){a.commissioned=m;a.expires=m+AUTO_LIFE;}
  }
 }
 p.projects=p.projects.filter(j=>j.remaining>1).map(j=>({...j,remaining:j.remaining-1}));
 return Math.round(Array.from({length:p.sections},(_,i)=>sectionBaseSpaces(p,i)*sectionFactor(p,i,m)).reduce((a,b)=>a+b,0));
}
function d21OpsModel(s,roster,trucks) {
 const m=state.month+1, p=d21Projection(s);
 const live=dot19Roster(s),nowTrucks=dot19TruckCount(s,state.month);
 const future=dot19Capacity(p,m,managementPenalty(state.player,{...p,staff:dot19Total(roster)}),roster,trucks);
 const capNow=dot19Capacity(s,state.month,managementPenalty(state.player,s),live,nowTrucks);
 const demand=contracts(s,m).reduce((n,k)=>n+Math.min(k.moves,k.spaces*5),0);
 const baseline=dot19Payroll(s)+nowTrucks*DOT19_OPS.lease;
 const labour=dot19Payroll({...s,staff:dot19Total(roster),shiftStaff:roster});
 const plannedCost=labour+trucks*DOT19_OPS.lease;
 const efficiency=managementPenalty(state.player,{...p,staff:dot19Total(roster)});
 const shifts=dot19ShiftPlan(p,m,roster,trucks).map(x=>Math.round(Math.min(x.dock,x.workforce*efficiency)));
 return {future,capNow,demand,delta:plannedCost-baseline,plannedCost,shifts,efficiency,bays:DOT17Facilities.doorCount(p)};
}
function d21Draft(s) {
 const key=state.month+':'+s.id;
 if(!D21.drafts.has(key)){
  D21.drafts.set(key,{roster:dot19TargetRoster(s),trucks:dot19TruckTarget(s)});
 }
 return D21.drafts.get(key);
}
function d21OpsStep(index,delta) {
 const s=selectedSite();if(!s||state.finished||![0,1,2,3].includes(index)||![-1,1].includes(delta))return;
 const d=d21Draft(s);const n=(index===3?d.trucks:d.roster[index])+delta;
 if(!Number.isSafeInteger(n)||n<0||(index!==3&&dot19Total(d.roster)+delta>150))return;
 if(index===3)d.trucks=n;else d.roster[index]=n;
 const card=document.querySelector('#d21-plan');if(card)card.innerHTML=d21OpsPanel(s);
 document.querySelector('#d21-plan [data-step="'+index+':'+delta+'"]')?.focus({preventScroll:true});
}
function d21ApplyOps() {
 const s=selectedSite();if(!s||state.finished)return;const {roster,trucks}=d21Draft(s);
 if(roster.some(n=>!Number.isSafeInteger(n)||n<0)||dot19Total(roster)>150||!Number.isSafeInteger(trucks)||trucks<0)return;
 const now=dot19Roster(s),fleet=dot19TruckCount(s,state.month);
 if(roster.every((n,i)=>n===now[i]))delete s.staffPlan;
 else {s.staffPlan={count:dot19Total(roster),effective:state.month+1};if(roster[1]||roster[2])s.staffPlan.shifts=[...roster];}
 s.mheTrucks=fleet;
 if(trucks===fleet)delete s.mhePlan;else s.mhePlan={count:trucks,effective:state.month+1};
 save();render();
 document.getElementById('d21-plan')?.focus({preventScroll:true});
}
function d21OpsPanel(s) {
 const d=d21Draft(s),m=d21OpsModel(s,d.roster,d.trucks),limit=d22Bottleneck(s,d.roster,d.trucks,m.efficiency),a=[...d.roster,d.trucks],n=[...dot19Roster(s),dot19TruckCount(s,state.month)];
 const queued=[...dot19TargetRoster(s),dot19TruckTarget(s)];
 const unsaved=a.some((x,i)=>x!==queued[i]),planned=queued.some((x,i)=>x!==n[i]);
 const names=['Day shift','Late shift','Night shift','Leased forklifts'];
 return '<div class="d21-kpi"><span class="d21-kicker">Pallet move capacity: this month → next month</span><div class="d21-big" aria-live="polite">'+num(m.capNow)+' <i>→</i> <b>'+num(m.future)+'</b></div><div class="d21-line"><span>Forecast pallet moves next month</span><strong>'+num(m.demand)+' moves</strong></div><div class="d21-meter" aria-hidden="true"><span style="width:'+Math.min(100,m.future?m.demand/m.future*100:m.demand?100:0)+'%"></span></div><small>'+ (m.demand>m.future?num(m.demand-m.future)+' moves over capacity':'Capacity for '+num(m.future-m.demand)+' more moves')+'</small></div>'+
 '<div class="d21-steps" role="group" aria-label="Staff per shift and leased forklifts">'+a.map((val,i)=>'<div '+(i===3?'id="d21-mhe"':'')+'><div class="d21-line d21-step-label"><b>'+names[i]+'</b><small>'+n[i]+' now</small></div><div class="d21-step"><button aria-label="Reduce '+names[i]+'" data-step="'+i+':-1" onclick="d21OpsStep('+i+',-1)" '+(!val||state.finished?'disabled':'')+'>−</button><b>'+val+'</b><button aria-label="Increase '+names[i]+'" data-step="'+i+':1" onclick="d21OpsStep('+i+',1)" '+(state.finished||i!==3&&dot19Total(d.roster)>=150?'disabled':'')+'>+</button></div></div>').join('')+'</div>'+
 '<div class="d21-line d21-cost"><span>Labour + forklifts / month</span><strong>'+fmt(m.plannedCost)+'</strong><b>'+d21Delta(m.delta,fmt)+'</b></div><button class="d21-primary" onclick="d21ApplyOps()" '+(!unsaved||state.finished?'disabled':'')+'>'+(unsaved?'Save for next month':planned?'Plan saved for next month':'No changes to apply')+' <span aria-hidden="true">→</span></button>'+
 d21Why('Days '+num(m.shifts[0])+' · lates '+num(m.shifts[1])+' · nights '+num(m.shifts[2])+' moves; '+m.bays+' dock doors next month. A forklift needs a driver and can be used on multiple shifts. '+(m.efficiency<1?'Too few managers reduces capacity. ':'')+'Uses current contracts; excludes disruptions and improvements not yet completed.')+'<div class="d22-show"><b>Capacity limit: '+esc(limit.label)+'</b><br><small>Moves staff can handle: '+num(limit.workforce)+' · moves docks can handle: '+num(limit.docks)+' · from '+esc(monthName(state.month+1))+'</small></div>';
}
function d21Unapplied(){
 return state.player.sites.some(s=>{const d=D21.drafts.get(state.month+':'+s.id);return d&&(d.trucks!==dot19TruckTarget(s)||d.roster.some((x,i)=>x!==dot19TargetRoster(s)[i]));});
}
function d21Warehouse() {
 const s=selectedSite();
 return d21Banner('Operations',s,false)+(s?d21Section('01','Plan next month').replace('<h2 ','<h2 id="d15-operations" ')+'<section class="d21-card" id="d21-plan" tabindex="-1">'+d21OpsPanel(s)+'</section>'+d21Section('02','Run this site')+
 d21Fold('people','Managers &amp; stock control','Cover decisions and protect stock.', '<section class="d21-sub"><h3 id="d15-staff">Operations management</h3><p>'+(s.managers||0)+' appointed · '+Math.floor(s.staff/10)+' required now · '+Math.floor(dot17StaffTarget(s)/10)+' needed for next month’s plan · £5,000 per manager per month · applies immediately</p><div class="d21-step"><button aria-label="Release manager" onclick="hireManager(-1)" '+(!s.managers||state.finished?'disabled':'')+'>−</button><b>'+(s.managers||0)+'</b><button aria-label="Hire manager" onclick="hireManager(1)" '+(state.finished?'disabled':'')+'>+</button></div><h3 id="d21-site-stock">Stock control</h3><p>£3,000/month · applies immediately. Reduces the chance and size of shortages.</p><button class="btn secondary" onclick="dot17ToggleSiteOps(\'stock\')" '+(state.finished?'disabled':'')+'>'+(s.stockController?'Release stock control manager':'Appoint stock control manager')+'</button>'+(s.last?.stockLoss?'<p>'+num(s.last.stockLoss.pallets)+' pallets missing last month · '+fmt(s.last.stockLoss.fine)+' charged.</p>':'')+'</section>')+
 d21Fold('safety','Safety &amp; fire protection','Health &amp; safety and fire protection.','<section class="d21-sub"><h3 id="d21-site-safety">Health &amp; safety manager</h3><p>'+(s.hs?'Manager appointed':'No manager appointed')+' · £4,000/month · applies immediately. Incident odds 40% without cover, 10% with.</p><button class="btn secondary" onclick="hs()" '+(state.finished?'disabled':'')+'>'+(s.hs?'Release':'Employ')+' H&amp;S manager</button>'+'<div class="d17-facility-status" aria-label="Fire protection">'+DOT20Fire.shortStatus(s)+'</div>'+'</section>')+
 d21Fold('stock','Contracts &amp; stock',num(occupancy(s))+' of '+num(siteSpace(s))+' spaces booked.', '<section class="d21-sub" id="d21-stock-levels">'+d17SiteSelector(s,false)+'<button class="btn secondary" onclick="goFromContext(\'history\')">View customer contracts</button></section>')
 :'<section class="d21-card"><p>No warehouse in this region.</p><button class="d21-primary" onclick="goFromContext(\'investment\')">Explore opening a site →</button></section>');
}
function d21OrderCards(s){
 const c=state.player, rackReady=s.racks+s.projects.filter(p=>p.type==='Racking').length;
 const rackLimit=Math.max(0,Math.min(s.sections*9-rackReady,Math.floor(c.cash/C.rack)));
 const racks=Math.min(D21.racks??1,rackLimit), turnStorage=d21Storage(s);
 const rackEffect=d21Storage(s,Array.from({length:racks},()=>({type:'Racking',remaining:1})));
 const buy=(label,desc,amount,when,impact,fn,disabled=false,reason='',id='')=>'<section class="d21-option"'+(id?' id="'+id+'"':'')+'><h3>'+label+'</h3><p>'+desc+'</p><div class="d21-line"><span>'+when+'</span><strong>'+fmt(amount)+'</strong></div><p class="d21-impact">'+impact+'</p>'+(reason?'<p>'+reason+'</p>':'')+'<button class="d21-primary" onclick="'+fn+'" '+(disabled||state.finished||c.cash<amount?'disabled':'')+'>Order '+label.toLowerCase()+' <span>→</span></button></section>';
 const groups=[['storage','Racking & docks'],['flow','Productivity'],['risk','Fire protection']];
 const tabs='<div class="d21-switch" role="group" aria-label="Upgrade type">'+groups.map(([k,v])=>'<button aria-pressed="'+(D21.upgrade===k)+'" onclick="d21Upgrade(\''+k+'\')">'+v+'</button>').join('')+'</div>';
 if(D21.upgrade==='storage')return tabs+d26Infrastructure(s)+'<div class="d21-option"><div class="d21-rack-art"><div><h3>Install racking</h3><p>Each package adds 250 pallet spaces before automation.</p></div><svg aria-hidden="true" viewBox="0 0 125 73" fill="none"><path d="M12 58l53 11 49-16-52-10z" fill="#e8deca"/><path d="M22 56V21l48-13 34 7v37M22 21l34 7 48-13M56 28v35M39 25v35m40-38v35M22 35l34 7 48-13M22 48l34 7 48-13" stroke="#373a31" stroke-width="2"/><path d="m27 26 9 2v7l-9-2zm16 4 9 2v7l-9-2zm17 2 15-4v8l-15 4zm23-6 15-4v8l-15 4zM27 40l9 2v7l-9-2zm33 6 15-4v8l-15 4z" fill="#bd5b39"/></svg></div><div class="d21-kpi d21-invest-kpi"><div><span class="d21-kicker">Pallet spaces next month</span><strong>'+num(turnStorage)+' <i>→</i> <b>'+num(rackEffect)+'</b></strong></div><div><span class="d21-kicker">Cash left after purchase</span><strong>'+fmt(c.cash-racks*C.rack)+'</strong></div></div><div class="d21-rack-row"><div><b>Racking packages</b><div class="d21-step"><button aria-label="Reduce racking packages" onclick="d21RackStep(-1)" '+(racks<=1?'disabled':'')+'>−</button><b>'+racks+'</b><button aria-label="Increase racking packages" onclick="d21RackStep(1)" '+(racks>=rackLimit?'disabled':'')+'>+</button></div></div><div><small>Cost now</small><strong>'+fmt(racks*C.rack)+'</strong><small>'+(rackLimit?'Ready next month':c.cash<C.rack?'Not enough cash':'No room for more racking')+'</small></div></div><button class="d21-primary" onclick="d21ApplyRacks()" '+(!racks||state.finished?'disabled':'')+'>Order racking <span>→</span></button>'+d21Why(d21Delta(rackEffect-turnStorage)+' pallet spaces added next month, on top of existing orders. Racking does not change pallet move capacity.')+'</div>';
 if(D21.upgrade==='flow'){
  const ci=dot19CIAvailable(s,state.month);
  const a=newAutomationSection(s);
  return tabs+
   buy('Automation','One automation lane with an operator: up to 30 pallet moves per hour.',C.auto,'Ready in 3 months',a===undefined?'No eligible section.':'+30% storage on section '+(a+1)+'; site capacity still depends on staffing and docks.','automate()',a===undefined,'','d21-upgrade-automation')+
   buy('Productivity improvement project','Help staff move more pallets by hand and by forklift.',ciCost(s),'Ready in 3 months','1–8% productivity gain when complete. '+dot19CICount(s)+' of 3 programmes used.','startCI()',!ci,!ci?'At least 24 months between starts; no more than three projects per site.':'')+
   d21Why('Automation capacity is per lane. The whole site is still limited by staff and dock doors.');
 }
 return tabs+[DOT20Fire.WATER,DOT20Fire.ROOF,DOT20Fire.RACK].map((type,i)=>{
  const q=DOT20Fire.quote(s,type);const note=['Enables roof protection; does not reduce the chance of a fire or its damage by itself.','Cuts fire damage and disruption in protected sections.','Further cuts fire damage and disruption where fitted.'][i];
  return buy(type,['Install water supply first.','Requires a water supply ready to use.','Requires roof protection plus racking.'][i],q.cost,d21Turns(q.months),note,"orderFireProtection('"+['tank','roof','rack'][i]+"')",!q.available,esc(q.reason),'d21-upgrade-'+['water','roof','rack'][i]);}).join('')+d21Why('Sprinklers reduce damage, not the chance of a fire. Monthly running cost: '+fmt(DOT20Fire.runningCost(s))+' per month.');
}
function d21Upgrade(k){if(!['storage','flow','risk'].includes(k))return;D21.upgrade=k;render();document.querySelector('.d21-switch [aria-pressed="true"]')?.focus({preventScroll:true});}
function d21RackStep(delta){const s=selectedSite();if(!s)return;const cap=Math.min(s.sections*9-s.racks-s.projects.filter(p=>p.type==='Racking').length,Math.floor(state.player.cash/C.rack));D21.racks=clamp(Math.min(D21.racks??1,cap)+delta,1,Math.max(1,cap));const el=document.getElementById('d21-upgrade');if(el){el.innerHTML=d21OrderCards(s);el.querySelector?.('[aria-label="'+(delta>0?'Increase':'Reduce')+' racking packages"]')?.focus({preventScroll:true});}}
function d21ApplyRacks(){const s=selectedSite(),c=state.player;if(!s||state.finished)return;const n=Math.max(0,Math.min(D21.racks??1,s.sections*9-s.racks-s.projects.filter(p=>p.type==='Racking').length,Math.floor(c.cash/C.rack)));if(!n)return;for(let i=0;i<n;i++)s.projects.push({type:'Racking',remaining:1,cost:C.rack});c.cash-=n*C.rack;D21.racks=1;D21.panels.set(tab+':projects',true);const p=document.querySelector('[data-fold="projects"]');if(p)p.open=true;save();render();}
function d21Investment(){
 const s=selectedSite(),c=state.player,r=regionOf(selected);
 return d21Banner('Investment',s,true)+(s?d21Section('01','Upgrade this site')+'<section class="d21-card" id="d15-investment"><div id="d21-upgrade">'+d21OrderCards(s)+'</div></section>':'<div class="d21-card"><h3>Open 25,000 sq ft site</h3><p>'+fmt(r.cost)+' now · '+fmt(playerSiteOverhead({region:r.id,sections:1}))+'/month running costs · opens immediately.</p><button class="d21-primary" onclick="openRegion(\''+r.id+'\')" '+(c.cash<r.cost||state.finished?'disabled':'')+'>Open warehouse →</button></div>')+
 d21Section('02','Other investment')+(s?d21Fold('sites','Sites &amp; expansion','Add floor space or open another site.','<div class="d21-sub" id="d21-site-expansion"><h3>Site expansion</h3><p>Use the site picker to open a warehouse in another region.</p><div class="d21-line"><b>+25,000 sq ft and one dock bay</b><strong>'+fmt(V18.extensionCost)+'</strong></div><p>'+EXPANSION_MONTHS+' months · '+fmt(playerSiteOverhead({...s,sections:s.sections+1})-playerSiteOverhead(s))+' extra running costs per month once open.</p><button class="btn" onclick="expand()" '+(state.finished||c.cash<V18.extensionCost||s.projects.some(p=>p.type==='Expansion')?'disabled':'')+'>Start expansion (pay in full)</button> <button class="btn secondary" onclick="investmentForecast(\'Expansion\')">View estimated cost and impact</button>'+d26MortgageCard(s)+'</div>'):'')+
 d21Fold('bank','Borrowing','Starter loans, business loans and repayments.',d26Bank())+
 (s?d21Fold('projects','Work in progress',s.projects.length?(s.projects.length+' in progress'):'No work in progress.',d17Projects(s)+automationPanel(s)):'');
}
function d21Render() {
 const view=document.getElementById('view');
 if(D21.renderedTab!==null)for(const d of (view.querySelectorAll?.('.d21-fold')||[]))D21.panels.set(D21.renderedTab+':'+d.dataset.fold,d.open);
 d21Header(); const fn={office,market,warehouse:d21Warehouse,investment:d21Investment,rivals:rivalsView,history}[tab];
 view.innerHTML=(d21SceneOrigin?'<button class="d21-scene-back" type="button" data-scene-return>← Back to warehouse view</button>':'')+((tab==='office'||tab==='market')?d22Guide():'')+(tab==='office'?d25Challenge()+d23Pressure()+d25Portfolio():'')+(tab==='rivals'?d23PublicRivals():'')+(tab==='office'?'<div class="d21-hub"><b>UK network</b><button class="btn secondary" onclick="goFromContext(\'rivals\')">Rival operators →</button></div>'+(d21Unapplied()?'<p class="notice">You have unsaved changes in Ops. Save them for next month before completing this month.</p>':''):'')+fn();
 D21.renderedTab=tab;
}
function d21BidQuote(input){
 const id=input.id.slice(2),t=state.tenders.find(t=>t.id===id);if(!t)return;
 const value=(p,k)=>{const x=document.getElementById(p+'-'+id).value.trim();return x===''?tenderDefault(t,k):Number(x);};
 const a=value('s','storage'),b=value('h','handling');
 document.getElementById('q-'+id).textContent=[a,b].every(n=>Number.isFinite(n)&&n>=0)
  ? 'Estimated monthly revenue at forecast volumes: '+fmt(t.spaces*a+t.moves*b)+' · starts '+monthName(t.start)
  : 'Enter a valid, non-negative price.';
}
