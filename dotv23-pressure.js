/* Signals, sealed bid feedback and interruption-safe turn advance. */
const D23_TYPES=[
 {label:'Established local operator',price:0.99,service:.15,term:24},
 {label:'Competes on service',price:1.02,service:1.8,term:18},
 {label:'Competes on price',price:.96,service:0,term:12}
];
function d23Type(c){
 const i=profiles.findIndex(p=>p.name===c.ai?.name);
 return D23_TYPES[Math.max(0,i)%3];
}
function d23RivalOffer(c,t){
 const p=d23Type(c);
 const local=c.sites[0]?.region===t.region;
 return {price:p.price*(p.label==='Established local operator'?(local?.98:1.035):1),
  strength:t.trial?0:(p.service*(t.variableVolume?1.45:.6)+(p.label==='Established local operator'&&local?1.3:0)+(t.term>=p.term?.4:0))};
}
function d23Signals(){
 const c=state.player,m=state.month;
 if(state.finished)return ['Business closed'];
 const out=[];
 const underway=c.sites.flatMap(s=>s.contracts.filter(k=>!k.spot&&k.end>=m&&k.end<=m+2).map(k=>({s,k})));
 for(const {s,k} of underway)out.push(k.name+' ends '+monthName(k.end)+' at '+s.name+'. Check whether to bid on the renewal or reserve the capacity.');
 if(state.tenders.some(t=>t.incumbent===c.name&&!state.bids[t.id]))out.push('Your renewal tender is open this month.');
 const bids=state.tenders.filter(t=>!state.bids[t.id]&&!!availableSite(c,t)).length;
 if(bids)out.push(bids+' tender'+(bids===1?' fits':'s fit')+' your storage and you haven’t bid yet.');
 if(Object.keys(state.bids).length)out.push('You’re awaiting bid results.');
 const due=c.sites.some(s=>s.projects.some(p=>p.remaining<=1)||s.staffPlan?.effective===m+1||s.mhePlan?.effective===m+1);
 if(due)out.push('A staffing, equipment or building change is due this month.');
 if(c.cash<2*playerRecurringCosts(c))out.push('Cash reserve is below two months of recurring costs.');
 for(const s of c.sites){
  const need=contracts(s,m).reduce((n,k)=>n+Math.min(k.moves,k.spaces*5),0);
  const now=siteCapacity(s,managementPenalty(c,s),m);
  if(need>now)out.push((s.name||'Depot')+' is forecast '+num(need-now)+' moves over capacity.');
 }
 if(D21.drafts.size&&d21Unapplied())out.push('Save or discard your unsaved changes in Ops first.');
 return [...new Set(out)];
}
function d23Advance(){
 if(state.finished||d23Signals().length)return;
 let i=0,last=null,interrupted=false;
 for(;i<3;){
  last=nextMonth(true);i++;
  interrupted=state.events.some(e=>!/^(RIVAL EXPANSION|OBJECTIVE ACHIEVED)/.test(e))||!!state.player.last?.incidents?.length;
  if(interrupted||d23Signals().length)break;
 }
 render();
 if(last){report(last.results,last.progressNotes);const e=document.querySelector('#dialog .modal');
 if(e?.insertAdjacentHTML)e.insertAdjacentHTML('afterbegin','<p class="d22-show"><b>'+i+' month'+(i===1?'':'s')+' advanced.</b> '+(interrupted?'Stopped because something needs attention.':d23Signals().length?'Stopped at the next decision.':'No interruption within the three-month limit.')+'</p>');}
}
function d23Pressure(){
 const signals=d23Signals();
 return '<section class="d22-card"><h2>Next decision</h2>'+(signals.length?'<ul class="list">'+signals.slice(0,3).map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul><button class="btn secondary" onclick="goFromNav(\'market\')">Review tenders</button>':'<p>Nothing needs your attention this month.</p><button class="btn secondary" onclick="d23Advance()">Skip ahead up to 3 months</button>')+'</section>';
}
function d23PublicRivals(){
 return '<section class="d22-card"><h2>Know your competition</h2><ul class="list">'+state.rivals.filter(c=>!c.bankrupt).map(c=>'<li><b>'+esc(c.name)+'</b> · '+d23Type(c).label+' · '+[...new Set(c.sites.map(s=>regionOf(s.region).name))].join(', ')+'</li>').join('')+'</ul></section>';
}
