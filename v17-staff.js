/* Player-only shift, equipment and inventory controls. The v17 save key and
   history fields are retained; old day rosters and equipment leases are read. */
const DOT19_OPS=Object.freeze({
  hours:165, manual:12, mhe:22, auto:30, lease:650, south:1.10,
  shifts:['Days','Lates','Nights'], premiums:[1,1.10,1.20],
  ciMonths:24, ciLimit:3
});
const DOT17_WORK=Object.freeze({stockControlCost:3000,shortageRate:350,shortageCap:28000});
const dot19Int=(value)=>Number.isSafeInteger(value)&&value>0?value:0;
const dot19Total=(values)=>values.reduce((n,x)=>n+x,0);
function dot19Roster(s) {
  const total=dot19Int(s.staff),late=Math.min(total,dot19Int(s.shiftStaff?.[1]));
  const night=Math.min(total-late,dot19Int(s.shiftStaff?.[2]));
  return [total-late-night,late,night];
}
function dot19TargetRoster(s,m=Infinity) {
  const plan=s.staffPlan,now=dot19Roster(s);
  if(!plan||!Number.isSafeInteger(plan.count)||plan.effective>m) return now;
  if(Array.isArray(plan.shifts)&&plan.shifts.length===3&&plan.shifts.every(n=>Number.isSafeInteger(n)&&n>=0)&&dot19Total(plan.shifts)===plan.count&&plan.count<=150) return [...plan.shifts];
  return [clamp(plan.count,0,150),0,0]; // Legacy one-shift roster.
}
function dot17StaffTarget(s) {return dot19Total(dot19TargetRoster(s))}
function dot17SetStaff(delta,shift=0) {
  const s=selectedSite();
  if(!s||state.finished||![-1,1].includes(delta)||!Number.isInteger(shift)||shift<0||shift>2) return;
  const planned=dot19TargetRoster(s),now=dot19Roster(s);
  if(planned[shift]+delta<0||dot19Total(planned)+delta>150) return;
  planned[shift]+=delta;
  if(planned.every((n,i)=>n===now[i])) delete s.staffPlan;
  else {
    s.staffPlan={count:dot19Total(planned),effective:state.month+1};
    if(planned[1]||planned[2]) s.staffPlan.shifts=planned;
  }
  save();render();
}
function dot19ShiftCount(s) {return dot19Roster(s).filter(n=>n>0).length}

function dot19TruckCount(s,m) {
  if(Number.isSafeInteger(s.mheTrucks)&&s.mheTrucks>=0) return s.mheTrucks;
  // The v17 switch was charged once per manual section. Preserve that count
  // once on import; don't add or remove trucks as sections change afterward.
  return s.mheLeased===true?Math.max(0,s.sections-dot19Lanes(s,m).length):0;
}
function dot19TruckTarget(s,m=Infinity,now=state.month) {
  const current=dot19TruckCount(s,now), plan=s.mhePlan;
  return plan&&Number.isSafeInteger(plan.count)&&plan.count>=0&&plan.effective<=m?plan.count:current;
}
function dot19SetTrucks(delta) {
  const s=selectedSite();
  if(!s||state.finished||![-1,1].includes(delta))return;
  const current=dot19TruckCount(s,state.month);
  const count=dot19TruckTarget(s)+delta;
  if(!Number.isSafeInteger(count)||count<0)return;
  s.mheTrucks=current;
  if(count===current)delete s.mhePlan;
  else s.mhePlan={count,effective:state.month+1};
  save();render();
}
function dot17SettleStaff(g) {
  const notes=[];
  for(const s of g.player.sites) {
    const plan=s.staffPlan;
    if(Number.isSafeInteger(plan?.count)&&plan.effective<=g.month) {
      const shifts=dot19TargetRoster(s,g.month);
      s.staff=dot19Total(shifts);s.shiftStaff=shifts;
      delete s.staffPlan;
      notes.push(`${s.name}: ${monthName(g.month)} roster — ${DOT19_OPS.shifts.map((label,i)=>label+' '+shifts[i]).join(', ')}.`);
    }
    if(Number.isSafeInteger(s.mhePlan?.count)&&s.mhePlan.effective<=g.month) {
      const old=dot19TruckCount(s,g.month), next=dot19TruckTarget(s,g.month,g.month);
      s.mheTrucks=next;s.mheLeased=next>0;delete s.mhePlan;
      if(next!==old) notes.push(`${s.name}: truck fleet ${old} → ${next} for ${monthName(g.month)}.`);
    }
  }
  return notes;
}
function dot19ReadLegacy(g) {
  for (const s of g.player.sites) {
    if(s.mheLeased===true&&!Number.isSafeInteger(s.mheTrucks))s.mheTrucks=dot19TruckCount(s,g.month);
  }
}
function dot19Lanes(s,m) {
  const rates=[];
  const elapsed=Math.max(0,m-(state?.month??m));
  for(let i=0;i<s.sections;i++) {
    const replacement=s.projects.find(p=>p.type==='Replacement'&&p.section===i);
    const installation=s.projects.find(p=>p.type==='Automation'&&p.section===i);
    const remaining=(replacement?.remaining??0)-elapsed;
    if(remaining>0){rates.push(remaining===2?.50:.75);continue}
    const a=assetFor(s,i);
    if((a&&m<a.expires)||(replacement&&remaining<=0)||(installation&&installation.remaining<=elapsed))rates.push(1);
  }
  return rates.sort((a,b)=>b-a);
}
function dot19ShiftPlan(s,m,roster=dot19Roster(s),trucks=dot19TruckCount(s,m),lanes=dot19Lanes(s,m)) {
  return roster.map((staff,i)=>{
    const automation=Math.min(staff,lanes.length),mhe=Math.min(staff-automation,trucks),manual=staff-automation-mhe;
    const workforce=DOT19_OPS.hours*((manual*DOT19_OPS.manual+mhe*DOT19_OPS.mhe)*(s.ci??1)+DOT19_OPS.auto*dot19Total(lanes.slice(0,automation)));
    const dock=staff>0?DOT17Facilities.doorCount(s)*DOT19_OPS.hours*30:0;
    return {i,staff,manual,mhe,automation,workforce,dock};
  });
}
function dot19Capacity(s,m,efficiency=1,roster,trucks,lanes) {
  return Math.round(dot19Total(dot19ShiftPlan(s,m,roster,trucks,lanes).map(x=>Math.min(x.dock,x.workforce*efficiency))));
}
function dot19DayPay(s){return C.staff*(s.region==='south'?DOT19_OPS.south:1)}
function dot19Payroll(s){return Math.round(dot19Total(dot19Roster(s).map((n,i)=>n*dot19DayPay(s)*DOT19_OPS.premiums[i])))}
function dot19AutomationGain(s,m,section) {
  if(section===undefined)return 0;
  const roster=dot19TargetRoster(s,m),trucks=dot19TruckTarget(s,m),lanes=dot19Lanes(s,m);
  const efficiency=managementPenalty(state.player,s);
  return dot19Capacity(s,m,efficiency,roster,trucks,[1,...lanes])-dot19Capacity(s,m,efficiency,roster,trucks,lanes);
}
function dot19CICount(s) {
  if(Number.isSafeInteger(s.ciStarts)&&s.ciStarts>=0)return s.ciStarts;
  const prior=s.ci>1?Math.ceil(Math.log(s.ci)/Math.log(1.08)-1e-6):0;
  return Math.min(DOT19_OPS.ciLimit,Math.max(0,prior)+(s.projects.some(p=>p.type==='CI')?1:0));
}
function dot19CINext(s){return dot19CICount(s)>=DOT19_OPS.ciLimit?Infinity:Math.max(1,(s.ciStart??-100)+DOT19_OPS.ciMonths)}
function dot19CIAvailable(s,m){return dot19CINext(s)<=m&&!s.projects.some(p=>p.type==='CI')}

function dot17SiteOpsCosts(s,m=state.month) {
  return {mheCost:dot19TruckCount(s,m)*DOT19_OPS.lease,stockControlCost:DOT30People.salary(s,'stock')};
}
function dot17ToggleSiteOps(option) {
  const s=selectedSite();if(!s||state.finished||option!=='stock')return;
  s.stockController=!s.stockController;save();render();
}
// Inventory variance is a per-site, per-month exposure; there is no risk on empty sites.
// In the abstract simulation the customer invoice settles the missing pallets; their contract stays live.
function dot17StockOdds(protectedStock,pressure) {
  return protectedStock ? .025+.055*pressure : .18+.30*pressure;
}
function dot17Inventory(c,s,ks,m,demand,capacity,random=Math.random) {
  const none={mheCost:0,stockControlCost:0,stockFines:0,stockShortages:0,stockLoss:null};
  if(c!==state.player) return none;
  Object.assign(none,dot17SiteOpsCosts(s,m));
  if(!ks.some(k=>k.spaces>0)) return none;
  const pallets=ks.reduce((n,k)=>n+k.spaces,0);
  const fill=clamp(pallets/Math.max(1,siteSpace(s)),0,1);
  const load=clamp(demand/Math.max(1,capacity),0,1);
  const pressure=(fill+load)/2;
  const control=s.stockController===true;
  const people=DOT30People.influence(s);
  if(random()>=clamp(dot17StockOdds(control,pressure)*people.stockOdds,0,.8)) return none;
  // Pick the affected customer proportional to their stock on site.
  let slot=random()*pallets;
  const customer=ks.find(k=>(slot-=k.spaces)<0)||ks.at(-1);
  const rate=(control?.003:.015)+random()*(control?.006:.030);
  const shortage=Math.min(customer.spaces,Math.max(1,Math.round(pallets*rate*people.stockSeverity)));
  const fine=Math.min(DOT17_WORK.shortageCap,shortage*DOT17_WORK.shortageRate);
  return {...none,stockFines:fine,stockShortages:shortage,stockLoss:{site:s.name,customer:customer.name,pallets:shortage,fine}};
}

function dot17OpsExpense(r) {
  return (r.mheCost||0)+(r.stockControlCost||0)+(r.stockFines||0);
}

function dot17StaffControls(s) {
  const future=state.month+1,current=dot19Roster(s),planned=dot19TargetRoster(s,future);
  const nextDemand=contracts(s,future).reduce((a,k)=>a+Math.min(k.moves,k.spaces*5),0);
  const coverage=dot19Capacity(s,future,managementPenalty(state.player,s),planned,dot19TruckTarget(s,future));
  const assignments=dot19ShiftPlan(s,state.month);
  return `<div class="d17-kit-grid">${DOT19_OPS.shifts.map((label,i)=>{
    const a=assignments[i];return `<article class="d17-shift"><h3>${label} · ${a.staff?'Open':'Closed'}</h3>
    <p>${current[i]} on roster now · ${planned[i]} next turn</p>
    <p class="muted">${a.manual} manual · ${a.mhe} truck · ${a.automation} automation · ${fmt(dot19DayPay(s)*DOT19_OPS.premiums[i])}/person/turn</p>
    <div class="stepper" aria-label="${label} next-turn staffing"><button aria-label="Remove one ${label.toLowerCase()} worker next turn" onclick="dot17SetStaff(-1,${i})" ${planned[i]===0?'disabled':''}>−</button><b>${planned[i]}</b><button aria-label="Add one ${label.toLowerCase()} worker next turn" onclick="dot17SetStaff(1,${i})" ${dot19Total(planned)>=150?'disabled':''}>+</button></div></article>`;
  }).join('')}</div>
  <p class="muted">A shift opens when staffed. Changes start next turn, not this turn. Each staffed shift has 165 productive hours. Staff are assigned to available automation lanes and then to trucks before working manually.</p>
  <p class="d17-plan ${coverage<nextDemand?'bad':'muted'}">Next turn: ${num(nextDemand)} committed movements · ${num(coverage)} planned capacity. Unsigned bids excluded.</p>`;
}

function dot17OpsPanel(s) {
  const current=dot19TruckCount(s,state.month),planned=dot19TruckTarget(s),cost=dot17SiteOpsCosts(s);
  const last=s.last?.stockLoss;
  return `<section class="panel d17-ops-kit"><h2>Equipment &amp; stock control</h2>
  <div class="d17-kit-grid"><article><h3><span aria-hidden="true">▰</span> MHE truck leases</h3>
  <p>${current} in fleet · ${planned} next turn · ${fmt(cost.mheCost)}/turn now</p>
  <div class="stepper" aria-label="Next-turn truck fleet"><button aria-label="Return one truck next turn" onclick="dot19SetTrucks(-1)" ${planned===0?'disabled':''}>−</button><b>${planned}</b><button aria-label="Lease one truck next turn" onclick="dot19SetTrucks(1)">+</button></div>
  <p class="muted">£650 per delivered truck per turn, even when idle. New trucks arrive next turn. Only a staffed truck adds throughput and the same truck can work successive shifts.</p></article>
  <article><h3><span aria-hidden="true">▦</span> Stock control manager</h3>
  <p>${s.stockController?'In post':'No cover'}</p>
  <p class="muted">Cycle counts reduce both the chance and size of shortages. Affected customers charge ${fmt(DOT17_WORK.shortageRate)} per missing pallet, capped at ${fmt(DOT17_WORK.shortageCap)} per site-month.</p>
  <button class="btn secondary" onclick="dot17ToggleSiteOps('stock')">${s.stockController?'Release manager':'Appoint manager · '+fmt(DOT17_WORK.stockControlCost)+'/turn'}</button>
  ${last?`<p class="bad">Last turn: ${num(last.pallets)} pallets missing for ${esc(last.customer)} · ${fmt(last.fine)} charged.</p>`:''}</article></div></section>`;
}
function dot17OpsReport(r) {
  if(!Number.isFinite(r?.mheCost))return '';
  return `<p>Equipment leases ${fmt(r.mheCost)} · Stock control ${fmt(r.stockControlCost)} · Customer shortage charges ${fmt(r.stockFines)}</p>`;
}
