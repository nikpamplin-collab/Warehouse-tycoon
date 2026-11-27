/* Guided opening and explanations. Sandbox rules and existing saves are unchanged. */
const D22={starter:'guide-first-',stretch:'guide-stretch-'};
function d22Begin(){
 if(state.month!==1||state.setupDone)return;
 state.firstContract={mode:document.getElementById('d22-guide').checked?'guide':'sandbox',result:null};
 d22Seed(state);
}
function d22Seed(g){
 if(g.firstContract?.mode!=='guide'||g.month>2||g.player.sites.some(s=>s.contracts.some(k=>k.id.startsWith(D22.starter))))return;
 const make=(id,name,spaces,moves,term)=>({id:id+g.month,region:'mid',name,spaces,moves,term,start:g.month+1,segment:'Industrial',marketPrice:marketPrice(g,'mid'),variableVolume:false,trial:id===D22.starter});
 g.tenders=[make(D22.starter,g.month===1?'Avon Toolworks':'Wye Tool & Fastener',200,850,6),make(D22.stretch,'Mercia Trade Supplies',400,1800,12),...g.tenders.filter(t=>!t.id.startsWith('guide-'))];
}
function d22Record(g,results){
 if(g.firstContract?.mode!=='guide'||g.month>2)return;
 const bid=g.tenders.find(t=>t.id.startsWith(D22.starter)&&g.bids[t.id]);
 if(bid)g.firstContract.result={month:g.month,won:g.player.sites.some(s=>s.contracts.some(k=>k.id===bid.id)),name:bid.name,note:results.find(r=>r.id===bid.id)?.text||''};
}
function d22Skip(){
 if(state.firstContract?.mode!=='guide')return;
 // End coaching without moving or withdrawing any already published tender.
 state.firstContract.mode='sandbox';save();render();
}
function d22Guide(){
 const g=state.firstContract;
 if(g?.mode!=='guide'||state.month>4||state.month===4&&g.result?.month!==2||state.finished)return '';
 const attempt=g.result,win=attempt?.won;
 let text=state.month===1?'Start with Avon Toolworks: 200 pallet spaces fit your 250-space depot. This buyer compares trial quotes on price. The suggested rates are a starting point, not a guarantee. This small job contributes towards your costs but will not pay for the whole depot. Set a price in Bids and plan handling in Ops. The bigger Mercia tender needs more space.':state.month===2?(win?'Your first job starts this month. Check your committed moves and the staff available now, then complete the month to see how it traded.':(attempt?'Your first bid did not win. ':'No starter bid went in. ')+'Wye Tool & Fastener is another job that fits the starter depot. Review the bid and plan capacity before advancing.'):win&&state.month===attempt.month+1?'Your job starts this turn. Check that your shifts cover its moves, then complete the month to see how it traded.':win?'A signed contract brings revenue, but depot overheads still need covering. Review the first trading result and decide whether to take more work or improve service.':'The guide ends here. You can keep improving the site and pursue contracts in Bids.';
 return '<section class="d22-card" aria-label="The First Contract"><strong>The First Contract · '+Math.min(3,state.month)+'/3</strong><p>'+esc(text)+'</p><div class="d22-actions"><button class="btn secondary" onclick="goFromNav(\'market\')">See contracts</button><button class="btn secondary" onclick="goFromNav(\'warehouse\')">Plan handling</button><button class="btn secondary" onclick="d22Skip()">End guide</button></div></section>';
}
function d22Fit(t){
 const sites=owned(state.player,t.region);
 const best=sites.map(s=>({s,free:freeForTender(s,t,siteSpace(s))})).sort((a,b)=>b.free-a.free)[0];
 if(!best)return {label:'No depot in '+regionOf(t.region).name+'.',gap:null,blocks:null};
 const free=Math.max(0,best.free),gap=Math.max(0,t.spaces-best.free),{s}=best;
 if(!gap)return {label:num(t.spaces)+' needed · '+num(free)+' available across the contract term',gap,blocks:0};
 const next=freeForTender(s,t,d21Storage(s));
 const blocks=Math.ceil(Math.max(0,t.spaces-next)/250),slots=s.sections*9-s.racks-s.projects.filter(p=>p.type==='Racking').length;
 const path=t.start>state.month&&blocks<=slots?(blocks?' '+blocks+' extra rack block'+(blocks===1?'':'s')+' would cost '+fmt(blocks*C.rack)+' and normally commission '+monthName(state.month+1)+'.':' Work already queued could close the gap by '+monthName(state.month+1)+'.'):'';
 return {label:num(t.spaces)+' needed · '+num(free)+' free now · '+num(gap)+' short at '+(s.name||regionOf(t.region).name)+'.'+path,gap,blocks};
}
function d22FitHtml(t){const f=d22Fit(t);return (t.trial?'<p><b>Trial order:</b> eligible bids are ranked by price, not reputation.</p>':'')+'<p class="d22-fit '+(f.gap===0?'good':'')+'">'+esc(f.label)+(f.gap>0?'<br><small>Only commissioned capacity qualifies. Use the estimate to plan for the next tender.</small>':'')+'</p>';}
function d22Bottleneck(s,roster,trucks,efficiency){
 const projected=d21Projection(s),month=state.month+1,shifts=dot19ShiftPlan(projected,month,roster,trucks);
 const limits=shifts.filter(x=>x.staff).map(x=>x.dock<=x.workforce*efficiency?'dock doors':x.manual&&trucks<Math.max(0,x.staff-x.automation)?'people and equipment':'staffed handling');
 return {workforce:Math.round(shifts.reduce((n,x)=>n+x.workforce*efficiency,0)),docks:Math.round(shifts.reduce((n,x)=>n+x.dock,0)),label:limits.length?[...new Set(limits)].join(' / '):'no shifts staffed'};
}
function d22Drivers(r,previous){
 const rows=[['Storage revenue','storage','Customer work',1],['Handling revenue','handling','Customer work',1],['Site overhead','rent','Committed cost',-1],['Labour','labour','Staffing',-1],['Safety cover','hs','Staffing',-1],['Management','management','Staffing',-1],['Equipment leases','mheCost','Equipment',-1],['Stock control','stockControlCost','Staffing',-1],['Stock shortage charges','stockFines','Incident',-1],['Safety incident costs','incidentCost','Incident',-1],['Overflow charges','overflowCost','Capacity',-1],['Facilities costs','facilityCost','Facilities',-1],['Interest','interest','Finance',-1]];
 return rows.map(([name,key,type,sign])=>({name,type,value:sign*(r[key]||0),delta:sign*((r[key]||0)-(previous?.[key]||0))}));
}
function d22Report(r,c){
 const prior=c.history.at(-2),rows=d22Drivers(r,prior),driver=r=>prior?r.delta:r.value;
 const headline=rows.filter(x=>Math.abs(driver(x))>=1).sort((a,b)=>Math.abs(driver(b))-Math.abs(driver(a))).slice(0,3);
 const guide=state.firstContract?.result;
 const advisor=r.stockFines?'Review stock control cover and the named customer shortage below.':r.missed>=1?'Review Ops: compare planned demand, staffed handling and dock limits. A disruption can reduce actual output.':r.storage+r.handling<r.rent?'Customer revenue did not cover site overhead. Review which additional work would fit before investing.':'Compare signed demand with staffing and available space before taking on more work.';
 return '<section class="d22-card"><h3>What moved the result?</h3><small>'+(prior?'Largest changes in profit contribution versus last month':'Largest contributions to this month’s profit')+'</small><ul class="list">'+headline.map(x=>'<li><strong>'+esc(x.name)+'</strong> '+money(driver(x))+' <small>'+esc(x.type)+'</small></li>').join('')+'</ul><p><b>Next check:</b> '+esc(advisor)+'</p>'+(guide?.month===r.month?'<p><b>'+esc(guide.name)+':</b> '+(guide.won?'Won. Trading starts next turn.':'Not won. '+esc(guide.note))+'</p>':'')+'<details><summary>Profit breakdown</summary><ul class="list">'+rows.filter(x=>x.value).map(x=>'<li>'+esc(x.name)+' '+money(x.value)+'</li>').join('')+'</ul><small>Loan principal is a cash outflow, not a trading cost: '+fmt(r.principal||0)+'.</small></details></section>';
}
