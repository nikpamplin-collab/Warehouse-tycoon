/* DOTv17 player-only staffing, equipment leasing and inventory control.
   Classic script: selectors may read game state, but only labelled controls and month hooks mutate it. */
const DOT17_WORK = Object.freeze({
  manual: .70,
  mheBoost: 1.30,
  mheCost: 650,
  stockControlCost: 3000,
  shortageRate: 350,
  shortageCap: 28000
});

function dot17StaffTarget(s) {
  return Number.isInteger(s.staffPlan?.count) ? clamp(s.staffPlan.count,0,150) : s.staff;
}

function dot17SetStaff(n) {
  const s=selectedSite();
  if(!s||!Number.isInteger(n)||state.finished) return;
  const count=clamp(dot17StaffTarget(s)+n,0,150);
  if(count===s.staff) delete s.staffPlan;
  else s.staffPlan={count,effective:state.month+1};
  save();render();
}

// Run after the closing payroll has posted and the game has advanced its calendar.
function dot17SettleStaff(g) {
  const notes=[];
  for(const s of g.player.sites) {
    const plan=s.staffPlan;
    if(!Number.isInteger(plan?.count)||plan.effective>g.month) continue;
    const old=s.staff;
    s.staff=dot17StaffTarget(s);
    delete s.staffPlan;
    if(old!==s.staff) notes.push(`${s.name}: staffing plan took effect for ${monthName(g.month)}: ${old} → ${s.staff} warehouse staff.`);
  }
  return notes;
}

function dot17IsManual(s,i,m=state.month) {
  return !s.projects.some(p=>p.type==='Replacement'&&p.section===i) && !(m < (assetFor(s,i)?.expires ?? -Infinity));
}
function dot17ManualCount(s,m=state.month) {
  let count=0;for(let i=0;i<s.sections;i++)if(dot17IsManual(s,i,m))count++;
  return count;
}
function dot17SectionFactor(s,i,m) {
  if(!state?.player?.sites.includes(s) || !dot17IsManual(s,i,m)) return sectionFactor(s,i,m);
  return DOT17_WORK.manual*(s.mheLeased===true?DOT17_WORK.mheBoost:1);
}
function dot17SiteOpsCosts(s,m=state.month) {
  return {
    mheCost:s.mheLeased===true?dot17ManualCount(s,m)*DOT17_WORK.mheCost:0,
    stockControlCost:s.stockController===true?DOT17_WORK.stockControlCost:0
  };
}
function dot17ToggleSiteOps(option) {
  const s=selectedSite();if(!s||state.finished) return;
  if(option==='mhe'&&(s.mheLeased||dot17ManualCount(s))) s.mheLeased=!s.mheLeased;
  if(option==='stock')s.stockController=!s.stockController;
  save();render();
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
  if(random()>=dot17StockOdds(control,pressure)) return none;
  // Pick the affected customer proportional to their stock on site.
  let slot=random()*pallets;
  const customer=ks.find(k=>(slot-=k.spaces)<0)||ks.at(-1);
  const rate=(control?.003:.015)+random()*(control?.006:.030);
  const shortage=Math.min(customer.spaces,Math.max(1,Math.round(pallets*rate)));
  const fine=Math.min(DOT17_WORK.shortageCap,shortage*DOT17_WORK.shortageRate);
  return {...none,stockFines:fine,stockShortages:shortage,stockLoss:{site:s.name,customer:customer.name,pallets:shortage,fine}};
}

function dot17OpsExpense(r) {
  return (r.mheCost||0)+(r.stockControlCost||0)+(r.stockFines||0);
}

function dot17StaffControls(s) {
  const current=s.staff,planned=dot17StaffTarget(s);
  const future=state.month+1;
  const scheduled=planned===current?`No staffing change queued for ${monthName(future)}`:`${planned} rostered from ${monthName(future)}`;
  const nextDemand=contracts(s,future).reduce((n,k)=>n+Math.min(k.moves,k.spaces*5),0);
  const futureProd=s.ci*C.moves*Array.from({length:s.sections},(_,i)=>dot17SectionFactor(s,i,future)).reduce((a,b)=>a+b,0)/Math.max(1,s.sections);
  const coverage=Math.round(planned*futureProd);
  return `<div class="row d17-staff-row"><div><b>${num(current)} staff on shift</b><p class="muted">${esc(scheduled)}. Changes take one month; current payroll and output do not change.</p></div>
    <div class="stepper" aria-label="Next month staffing"><button aria-label="Remove one staff next month" onclick="staff(-1)" ${planned<=0?'disabled':''}>−</button><b>${num(planned)}</b><button aria-label="Add one staff next month" onclick="staff(1)" ${planned>=150?'disabled':''}>+</button></div></div>
    <p class="d17-plan ${coverage<nextDemand?'bad':'muted'}">Next month: ${num(nextDemand)} committed moves · ${num(coverage)} planned capacity before management and site constraints. Excludes unsigned bids and unfinished projects.</p>`;
}

function dot17OpsPanel(s) {
  const manual=dot17ManualCount(s),cost=dot17SiteOpsCosts(s);
  const last=s.last?.stockLoss;
  return `<section class="panel d17-ops-kit"><h2>Equipment &amp; stock control</h2>
  <div class="d17-kit-grid"><article><h3><span aria-hidden="true">▰</span> MHE lease</h3>
  <p>${manual} manual ${manual===1?'section':'sections'} · ${s.mheLeased?'Lease active':'No lease'}</p>
  <p class="muted">Boost manual handling by 30%. Unequipped manual sections run at 70% of the old standard. Automated sections do not need leased equipment.</p>
  <button class="btn secondary" onclick="dot17ToggleSiteOps('mhe')" ${!manual&&!s.mheLeased?'disabled':''}>${s.mheLeased?'End lease · '+fmt(cost.mheCost)+'/mo':'Lease MHE · '+fmt(manual*DOT17_WORK.mheCost)+'/mo'}</button>
  <p class="muted">Billed monthly at ${fmt(DOT17_WORK.mheCost)} per manual section. Sections that change status are counted automatically.</p></article>
  <article><h3><span aria-hidden="true">▦</span> Stock control manager</h3>
  <p>${s.stockController?'In post':'No cover'}</p>
  <p class="muted">Cycle counts reduce both the chance and size of shortages. Affected customers charge ${fmt(DOT17_WORK.shortageRate)} per missing pallet, capped at ${fmt(DOT17_WORK.shortageCap)} per site-month.</p>
  <button class="btn secondary" onclick="dot17ToggleSiteOps('stock')">${s.stockController?'Release manager':'Appoint manager · '+fmt(DOT17_WORK.stockControlCost)+'/mo'}</button>
  ${last?`<p class="bad">Last month: ${num(last.pallets)} pallets missing for ${esc(last.customer)} · ${fmt(last.fine)} charged.</p>`:''}</article></div></section>`;
}

function dot17OpsReport(r) {
  if(!Number.isFinite(r?.mheCost))return '';
  return `<p>Equipment leases ${fmt(r.mheCost)} · Stock control ${fmt(r.stockControlCost)} · Customer shortage charges ${fmt(r.stockFines)}</p>`;
}
