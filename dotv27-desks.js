/* DOTv27: view-only desks; transactions and calculations use the existing engine. */
const D27={map:false,region:null,pair:['player',null],bidView:'all',financeView:'trading',info:new Map(),modalFocus:null,modalOpen:false};
const d27Disabled=x=>x?' disabled':'';
const d27Button=(label,action,disabled=false,style='')=>'<button type="button" class="d27-button '+style+'" onclick="'+action+'"'+d27Disabled(disabled)+'>'+label+'</button>';
const d27Info=(id,title,detail)=>{
 D27.info.set(id,{title,detail});
 return '<button class="d27-info" type="button" aria-label="About '+esc(title)+'" onclick="d27ShowInfo(this,\''+id+'\')"><span aria-hidden="true">i</span></button>';
};
function d27Modal(title,body,source,closeLabel='Close'){
 D27.modalFocus=source;D27.modalOpen=true;
 dialog('<div class="d27-popup"><h2 id="d27-dialog-title" tabindex="-1">'+esc(title)+'</h2>'+body+
   d27Button(closeLabel,'d27Close()',false,closeLabel==='Continue'?'d27-report-continue':'quiet')+'</div>');
 const wrap=document.getElementById('dialog');
 wrap.querySelector?.('[role=dialog]')?.setAttribute('aria-labelledby','d27-dialog-title');
 document.getElementById('d27-dialog-title')?.focus({preventScroll:true});
}
function d27Close(restore=true){
 const source=D27.modalFocus;D27.modalOpen=false;D27.modalFocus=null;closeDialog();
 if(restore&&source?.isConnected)source.focus({preventScroll:true});
}
function d27ModalKey(e){
 if(!D27.modalOpen||document.getElementById('dialog').classList.contains?.('hidden'))return;
 if(e.key==='Escape'){e.preventDefault();d27Close();}
 if(e.key==='Tab'){
  const bs=[...(document.getElementById('dialog').querySelectorAll?.('button:not([disabled]),a[href],select:not([disabled]),input:not([disabled]),summary')||[])].filter(el=>el.getClientRects().length);
  if(bs.length&&e.shiftKey&&(document.activeElement===bs[0]||document.activeElement?.id==='d27-dialog-title')){e.preventDefault();bs.at(-1).focus();}
  if(bs.length&&!e.shiftKey&&document.activeElement===bs.at(-1)){e.preventDefault();bs[0].focus();}
 }
}
function d27ShowInfo(source,id){const item=D27.info.get(id);if(item)d27Modal(item.title,item.detail,source);}
function d27Complete(source){
 const extra=(state.eventOffer?d27Button('Choose response','d27Close(false);showEvent()'):'')+d25Challenge()+(!state.finished&&!d23Signals().length?d27Button('Skip up to 3 quiet months','d27Close(false);d23Advance()',false,'quiet'):'');
 d27Modal('Complete '+monthName(state.month),'<p>'+num(Object.keys(state.bids).length)+' of '+num(state.tenders.length)+' tenders bid.</p>'+
   (d21Unapplied()?'<p class="d27-warning">You have an unsaved staff or truck plan. Save it in Ops Office before completing the month.</p>':'')+
   d27Button('Complete month','d27Close(false);nextMonth()',state.finished)+extra,source);
}
function d27Report(results,progressNotes,skip){
 const c=state.player,r=c.last;if(!r)return;
 const stat=(name,value,style='')=>'<div><dt>'+name+'</dt><dd class="'+style+'">'+value+'</dd></div>';
 const section=(title,content)=>'<details class="d27-report-details"><summary>'+title+'</summary>'+content+'</details>';
 const list=items=>items.length?'<ul>'+items.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p>None this month.</p>';
 const incidentCount=r.incidents?.length||0, missed=r.missed||0;
 const notes=state.events||[], urgent=notes.filter(x=>/^(STOCK SHORTAGE|CHALLENGE COMPLETE):/.test(x));
 const other=notes.filter(x=>!urgent.includes(x));
 const tenders=regions.map(region=>{
  const items=results.filter(x=>x.region===region.id);return items.length?'<h3>'+esc(region.name)+'</h3>'+list(items.map(x=>x.text)):'';
 }).join('');
 const changes=progressNotes.length||results.length||other.length;
 const tally='<dl class="d27-report-kpis">'+stat(r.profit<0?'Loss':'Profit',money(r.profit),r.profit<0?'bad':'good')+stat('Cash now',cash(c))+'</dl>';
 const moves='<h3>Pallet move results</h3><dl class="d27-report-moves">'+stat('Completed',num(r.handled)+' of '+num(r.demand))+stat('Not completed',num(missed),missed?'bad':'good')+'</dl>';
 const exceptions=(incidentCount?'<p class="d27-warning">'+num(incidentCount)+' safety incident'+(incidentCount===1?'':'s')+'. See details below.</p>':'')+
  urgent.map(x=>'<p class="d27-warning">'+esc(x.replace(/^STOCK SHORTAGE:/,'Stock shortage:').replace(/^CHALLENGE COMPLETE:/,'Challenge complete:'))+'</p>').join('')+
  (state.finished?'<p class="d27-warning">Your business is bankrupt.</p>':'');
 const why=d22Report(r,c);
 const moveDetails='<dl class="d27-report-lines">'+stat('Forecast pallet moves',num(r.forecast))+stat('Pallet move capacity',num(r.capacity))+'</dl>'+incidentSummary(r);
 const bids=tenders||'<p>No tender results this month.</p>';
 const changeDetails=(progressNotes.length?'<h3>Site changes</h3>'+list(progressNotes):'')+(other.length?'<h3>Market news</h3>'+list(other):'')+'<h3>Tender results by region</h3>'+bids;
 const range=skip?'<p>'+num(skip.count)+' month'+(skip.count===1?'':'s')+' advanced. '+(skip.interrupted?'Stopped because something needs attention.':skip.next?'Stopped at the next decision.':'No interruption.')+'</p>':'';
 d27Modal(monthName(r.month)+' results','<div class="d27-report">'+range+tally+moves+exceptions+
  section('Profit details',why)+section('Moves and incidents',moveDetails)+section(changes?'Tenders, site changes and news':'Tenders and site changes',changeDetails)+'</div>',
  document.querySelector('#metrics .advance'),'Continue');
}
function d27Return(){
 D27.map=false;D27.region=null;
 if(d21SceneOrigin){d21BackToScene();return;}
 if(!selectedSite()&&state.player.sites.length){openMapSite(0,'office');window.scrollTo?.({top:0,behavior:'instant'});return;}
 goFromNav('office');
}
function d27Header(){
 const head=document.querySelector('header h1');head.textContent=tab==='office'?'Home':state.player.name;
 document.getElementById('headline').innerHTML=tab==='office'?'':d27Button('⌂ Return to Home','d27Return()',false,'quiet');
 document.getElementById('metrics').innerHTML=(tab==='office'?d27Button(D27.map?'＋ Back to warehouse':'− Zoom out to UK map','d27Zoom()',false,'quiet'):'')+
   d27Button(state.finished?'Bankrupt':'Complete month','d27Complete(this)',state.finished,'advance');
 const names=[['office','Home'],['warehouse','Ops Office'],['market','Bids'],['investment','Invest'],['history','Finances'],['rivals','Rivals']];
 document.getElementById('tabs').innerHTML=names.map(([k,v])=>'<button aria-current="'+(tab===k?'page':'false')+'" class="'+(tab===k?'active':'')+'" id="d17-nav-'+k+'" onclick="'+(k==='office'?'d27Return()':"goFromNav(\'"+k+"\')")+'"><span>'+v+'</span></button>').join('');
}
const D27_PINS=[['north',159,113,60,-9,133],['mid',177,185,62,-7,98],['south',218,242,54,7,99]];
function d27Zoom(){D27.map=!D27.map;D27.region=null;render();document.getElementById(D27.map?'d27-map-mid':'d27-home-title')?.focus({preventScroll:true});}
function d27Territory(id,source){
 const sites=owned(state.player,id), r=regionOf(id);D27.region=id;
 if(sites.length===1){d27HomeSite(state.player.sites.indexOf(sites[0]));return;}
 d27Modal(r.name,sites.length?sites.map(s=>d27Button(esc(s.name),'d27HomeSite('+state.player.sites.indexOf(s)+')')).join(''):
  '<p>No warehouse in this territory.</p>'+d27Button('Open in Invest',"d27Close(false);pickRegion(\'"+id+"\');goFromNav(\'investment\')"),source);
}
function d27HomeSite(i){if(D27.modalOpen)d27Close(false);D27.map=false;D27.region=null;openMapSite(i,'office');document.getElementById('d27-home-title')?.focus({preventScroll:true});}
function d27Map(s){
 const outline=D27_OUTLINE;
 const map='<svg viewBox="0 0 425 329" class="d27-map-svg" aria-label="UK warehouse territories"><path d="'+outline+'" fill="#a6c6a7" stroke="#4f7961" stroke-width="2"/>'+
 D27_PINS.map(([id,x,y,dx,dy,w])=>{
  const label=regionOf(id).name,n=owned(state.player,id).length;
  return '<g role="button" tabindex="0" id="d27-map-'+id+'" aria-label="'+esc(label)+': '+n+' warehouses" data-d27-region="'+id+'"><path d="M'+x+' '+y+'l'+dx+' '+dy+'" stroke="#266454" stroke-width="2"/><circle cx="'+x+'" cy="'+y+'" r="9" fill="'+(n?'#166558':'#677a73')+'" stroke="white" stroke-width="2"/><rect x="'+(x+dx)+'" y="'+(y+dy-15)+'" width="'+w+'" height="32" rx="8" fill="#f8fff6" stroke="#276557" stroke-width="1.5"/><text x="'+(x+dx+w/2)+'" y="'+(y+dy+6)+'" text-anchor="middle">'+esc(label)+'</text></g>';
 }).join('')+'</svg>';
 return '<section class="d27-home d27-map"><h2 id="d27-home-title" tabindex="-1">UK network</h2>'+map+'</section>';
}
function d27Home(){
 const s=selectedSite()||state.player.sites[0];
 if(D27.map||!s)return d27Map(s);
 return '<section class="d27-home"><h2 id="d27-home-title" tabindex="-1">'+esc(s.name)+'</h2>'+
   d27Button(visualSceneMotion?'Pause motion':'Resume motion','visualSceneMotion=!visualSceneMotion;render()',false,'d27-motion')+
   warehouseGraphic(s)+'</section>';
}
function d27Heading(title,s){
 const options=regions.map(r=>'<optgroup label="'+esc(r.name)+'">'+(owned(state.player,r.id).map(x=>'<option value="'+esc(x.id)+'" '+(s===x?'selected':'')+'>'+esc(x.name)+'</option>').join('')||'<option value="region:'+r.id+'" '+(!s&&selected===r.id?'selected':'')+'>'+esc(r.name)+' · no site</option>')+'</optgroup>').join('');
 return '<div class="d27-title"><h2 id="d17-screen-title" tabindex="-1">'+title+'</h2><select aria-label="Choose a warehouse or territory" onchange="d21Choose(this.value)">'+options+'</select></div>';
}
function d27Capacity(s,roster,trucks){
 const m=state.month+1, p=d21Projection(s), ops=d21OpsModel(s,roster,trucks);
 const shifts=dot19ShiftPlan(p,m,roster,trucks);
 const handling=Math.round(shifts.reduce((n,x)=>n+x.workforce*ops.efficiency,0));
 const uneven=shifts.some(x=>x.dock>0&&x.workforce*ops.efficiency>x.dock)&&
   shifts.some(x=>x.dock>0&&x.workforce*ops.efficiency<x.dock);
 return {p,m,ops,handling,uneven,dock:DOT17Facilities.dockCapacity(p,roster.filter(n=>n>0).length),storage:d21Storage(s),booked:contracts(s,m).reduce((n,k)=>n+k.spaces,0)};
}
function d27Status(need,cap){
 return need>cap?['over','Breach']:need>0&&need>=cap*.9?['close','Close']:['safe','Safe'];
}
const d27Panel=(body,id='',extra='')=>'<section class="d27-panel '+extra+'"'+(id?' id="'+id+'"':'')+'>'+body+'</section>';
function d27OpsPanel(s){
 const d=d21Draft(s), {dock,handling,storage,booked,ops,uneven}=d27Capacity(s,d.roster,d.trucks);
 const amt=[...d.roster,d.trucks], live=[...dot19Roster(s),dot19TruckCount(s,state.month)], plan=[...dot19TargetRoster(s),dot19TruckTarget(s)];
 const unsaved=amt.some((x,i)=>x!==plan[i]),planned=plan.some((x,i)=>x!==live[i]);
 const metrics=[
  ['docks','Dock pallet moves',ops.demand,dock,'Receipt and despatch share the dock limit. Only staffed shifts count.'],
  ['handling','Pallet handling',ops.demand,ops.future,'Usable capacity is the lower of dock capacity and what the crew and kit can handle on each shift. Before dock limits, crew and kit could handle '+num(handling)+' moves.'],
  ['storage','Pallet storage',booked,storage,'Booked pallet spaces next month versus usable storage, including racking or projects due by then.']];
 const table='<table class="d27-table"><thead><tr><th scope="col">Measure</th><th scope="col">Forecast</th><th scope="col">Capacity</th><th scope="col">Status</th></tr></thead><tbody>'+metrics.map(([id,name,need,cap,help])=>{
   const [tone,label]=d27Status(need,cap);
   return '<tr><th scope="row"><span class="d27-with-info">'+name+d27Info(id,name,'<p>'+help+'</p>')+'</span></th><td>'+num(need)+'</td><td>'+num(cap)+'</td><td><span class="d27-chip '+tone+'">'+label+'</span></td></tr>';
 }).join('')+'</tbody></table>';
 const shifts=['Day shift','Late shift','Night shift','MHE trucks'];
 const rows='<div class="d27-roster d27-roster-head"><span>Resource</span><span>Now</span><span>Next</span><span>Adjust</span></div>'+amt.map((n,i)=>{
  const name=shifts[i], help=i===3?'Leased forklifts cost '+fmt(DOT19_OPS.lease)+' each per month. A forklift needs an operator and can work on more than one shift.':'Changes take effect next month when you save. A staffed shift unlocks dock time. Shift premiums are included in the labour cost shown.';
  return '<div class="d27-roster"'+(i===3?' id="d21-mhe"':'')+'><b class="d27-with-info">'+name+d27Info('shift'+i,name,'<p>'+help+'</p>')+'</b><strong>'+num(live[i])+'</strong><strong>'+num(n)+'</strong><div class="d27-step">'+[-1,1].map(dx=>'<button type="button" data-step="'+i+':'+dx+'" aria-label="'+(dx<0?'Reduce ':'Increase ')+name+'" onclick="d21OpsStep('+i+','+dx+')"'+d27Disabled(state.finished||(dx<0?!n:i!==3&&dot19Total(d.roster)>=150))+'>'+(dx<0?'−':'+')+'</button>').join('')+'</div></div>';
 }).join('');
 const warning=uneven&&ops.demand>ops.future&&ops.future<Math.min(dock,handling)?
  '<p class="d29-shift-warning" role="status">An imbalance in shift staffing limits how many pallets you can move.</p>':'';
 return '<h3 id="d15-operations">Capacity next month</h3>'+d27Panel(table+warning)+
   '<h3>People &amp; equipment</h3>'+d27Panel(rows+'<div class="d27-cost"><span>Labour + trucks / month</span><strong>'+fmt(ops.plannedCost)+'</strong></div>'+
   d27Button(unsaved?'Save for next month':planned?'Plan saved for next month':'No changes to save','d21ApplyOps()',!unsaved||state.finished,'wide'));
}
function d27BlobIcons(occ,auto){
 const robot='<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M8 4V2M6.8 2h2.4M3 7H1.8m12.4 0H13M5 5h6a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="6" cy="8.8" r=".8" fill="currentColor"/><circle cx="10" cy="8.8" r=".8" fill="currentColor"/></svg>';
 return '<span class="d27-indicators" role="img" aria-label="'+Math.round(occ*100)+' percent booked, '+Math.round(auto*100)+' percent automated">'+
 Array.from({length:10},(_,i)=>{const automated=i<Math.round(auto*10);return '<i class="'+(i<Math.min(10,Math.round(occ*10))?'gold':'')+' '+(automated?'auto':'')+'">'+(automated?robot:'')+'</i>';}).join('')+'</span>';
}
function d27Ops(){
 const s=selectedSite();if(!s)return d27Heading('Ops Office',s)+d27Panel('<p>No warehouse in this territory.</p>'+d27Button('Explore opening a site',"goFromNav(\'investment\')"));
 const staff=[['d15-staff','Ops manager',s.managers||0,'hireManager(1)','hireManager(-1)','£5,000/month each. A manager covers up to ten staff for the purpose of the management penalty. Understaffed management reduces pallet move capacity.'],
 ['d21-site-stock','Stock manager',s.stockController?1:0,"dot17ToggleSiteOps(\'stock\')","dot17ToggleSiteOps(\'stock\')",'£3,000/month. Reduces the chance and size of stock shortages and associated fines.'],
 ['d21-site-safety','H&amp;S manager',s.hs?1:0,'hs()','hs()','£4,000/month. Reduces the chance of health and safety incidents. Fire protection equipment is managed in Invest.']];
 const occ=siteSpace(s)?occupancy(s)/siteSpace(s):0, auto=dot19Lanes(s,state.month).length/s.sections;
 return d27Heading('Ops Office',s)+'<section id="d21-plan" tabindex="-1">'+d27OpsPanel(s)+'</section><h3>Site managers</h3>'+
 d27Panel(staff.map(([id,name,n,hire,release,info],i)=>'<div class="d27-role" id="'+id+'"><b class="d27-with-info">'+name+d27Info('role'+i,name.replace('&amp;','&'),'<p>'+info+'</p>')+'</b><strong>'+(i===0?num(n)+' in post':n?'In post':'Vacant')+'</strong><div class="d27-role-buttons">'+
  (i===0||n?d27Button('Release',release,!n||state.finished,'quiet'):'')+(i===0||!n?d27Button('Employ',hire,state.finished):'')+'</div></div>').join(''))+
 '<h3>Warehouse operations</h3>'+d27Panel('<div id="d21-stock-levels" class="d27-blobs"><b>Storage &amp; automation</b>'+d27Info('blobs','Storage and automation','<p>Gold shows storage booked: '+num(occupancy(s))+' of '+num(siteSpace(s))+' pallet spaces. A ring shows automation: '+num(dot19Lanes(s,state.month).length)+' of '+num(s.sections)+' sections.</p>'+d27Button('Rename warehouse','d27Close(false);renameSite()',state.finished,'quiet'))+
 d27BlobIcons(occ,auto)+'</div>');
}
function d27Investment(){
 const s=selectedSite(), c=state.player, r=regionOf(selected);
 const categories=[['storage','Racking &amp; docks'],['flow','Automation'],['risk','Fire protection'],['bank','Borrowing']];
 let html=d27Heading('Invest',s)+'<div class="d27-menu" aria-label="Investment options">'+categories.map(([k,label])=>'<button type="button" data-d27-invest="'+k+'" aria-pressed="'+(D21.upgrade===k)+'" onclick="d27Upgrade(\''+k+'\')">'+label+'</button>').join('')+'</div>'+
   '<div class="d27-cost d27-cash"><b>Cash available</b><strong>'+cash(c)+'</strong></div>';
 if(D21.upgrade==='bank')return html+d27Bank();
 if(!s)return html+d27Buy('Open warehouse',fmt(r.cost),'Immediate','25,000 sq ft',"openRegion(\'"+r.id+"\')",state.finished||c.cash<r.cost,'newsite','Opening gives access to tenders in this territory. Starting running costs: '+fmt(playerSiteOverhead({region:r.id,sections:1}))+' per month.','','Open warehouse');
 html+='<div id="d15-investment"><div id="d21-upgrade">'+d27Orders(s)+'</div></div>';
 return html+d27Expansion(s)+(s.projects.length?d27Panel('<div class="d27-with-info"><h3 id="d15-projects">Work in progress · '+s.projects.length+'</h3></div>'+s.projects.map((p,i)=>'<div class="d27-project"><b>'+esc(p.type==='CI'?'Continuous improvement programme':p.type)+'</b><span>'+num(p.remaining)+' '+(p.remaining===1?'month':'months')+'</span>'+d27Button('Cancel','cancelProject('+i+')',p.mortgaged||p.type==='Replacement','quiet')+'</div>').join('')):'<div id="d15-projects"></div>');
}
function d27Upgrade(k){
 if(!['storage','flow','risk','bank'].includes(k))return;
 D21.upgrade=k; render();document.querySelector('[data-d27-invest="'+k+'"]')?.focus({preventScroll:true});
}
function d27Buy(title,price,lead,impact,action,disabled,id,help,extra='',label='',anchor=''){
 return d27Panel('<div class="d27-with-info"><h3>'+esc(title)+'</h3>'+d27Info(id,title,'<p>'+esc(help)+'</p>')+'</div>'+
 '<div class="d27-buy-numbers"><strong>'+price+'</strong><b>'+lead+'</b></div><p class="d27-effect">'+impact+'</p>'+extra+
 d27Button(label||'Buy '+esc(title.toLowerCase()),action,disabled,'wide'),anchor,'d27-buy');
}
function d27Orders(s){
 const c=state.player, off=(cost)=>state.finished||c.cash<cost, group=D21.upgrade;
 if(group==='storage'){
  const rackLimit=Math.max(0,Math.min(s.sections*9-s.racks-s.projects.filter(p=>p.type==='Racking').length,Math.floor(c.cash/C.rack)));
  const qty=Math.min(D21.racks??1,rackLimit), before=d21Storage(s), ready=d21Storage(s,Array.from({length:qty},()=>({type:'Racking',remaining:1})));
  const step='<div class="d27-cost"><span>Packages</span><div class="d27-step">'+d27Button('−','d27RackStep(-1)',qty<=1||state.finished,'quiet')+'<b>'+qty+'</b>'+d27Button('+','d27RackStep(1)',qty>=rackLimit||state.finished,'quiet')+'</div></div>';
  const faq='Each package adds 250 pallet spaces before automation. Racking does not increase pallet move capacity. '+(!qty?(c.cash<C.rack?'Not enough cash.':'No room for more racking.'):'Cash after purchase: '+fmt(c.cash-qty*C.rack)+'.');
  const quote=DOT17Facilities.quote(s,DOT17Facilities.DOCK), roster=dot19TargetRoster(s,state.month+1), shifts=roster.filter(n=>n>0).length;
  const base=d21Projection(s), added=d21Projection(s,[{type:DOT17Facilities.DOCK,remaining:1}]);
  const dockEffect=quote.available?'Dock moves / month: '+num(DOT17Facilities.dockCapacity(base,shifts))+' → '+num(DOT17Facilities.dockCapacity(added,shifts)):'Dock doors ready: '+num(DOT17Facilities.doorCount(s));
  const doorLine='<div class="d27-cost"><span>Dock doors ready</span><strong>'+num(DOT17Facilities.doorCount(s))+'</strong></div>';
  return d27Buy('Racking package',fmt((qty||1)*C.rack),'1 month','Pallet spaces: '+num(before)+' → '+num(ready),'d21ApplyRacks()',!qty||off(qty*C.rack),'rack',faq,step,'Buy racking')+
   d27Buy('Dock door',fmt(quote.cost),'1 month',dockEffect,"orderWarehouseFacility(\'dock\')",!quote.available||off(quote.cost),'buydock',
   (!quote.available?(quote.queued?'A dock door is on order. ':'No spare dock positions. '):'')+'Extra dock capacity is based on the saved staffing plan. Labour can still limit output.',doorLine, 'Buy dock door','d17-facilities');
 }
 if(group==='flow'){
  const lane=newAutomationSection(s), ci=dot19CIAvailable(s,state.month), cost=ciCost(s);
  return d27Buy('Automation',fmt(C.auto),'3 months',lane===undefined?'No eligible section':'+30% storage in section '+(lane+1),'automate()',lane===undefined||off(C.auto),'automation','One lane can handle up to 30 moves/hour with an operator. Staffing and docks still limit site capacity.','',null,'d21-upgrade-automation')+
  d27Buy('Continuous improvement programme',fmt(cost),'3 months','1–8% productivity gain','startCI()',!ci||off(cost),'ci','At least 24 months between projects; maximum three per warehouse. Used: '+dot19CICount(s)+'.')+
  (s.automationAssets.length?d27Panel('<h3>Replace automation</h3>'+s.automationAssets.map(a=>'<div class="d27-project"><b>Section '+(a.section+1)+'</b><span>Ends '+esc(monthName(a.expires))+'</span>'+d27Button('Replace','replaceAutomation('+a.section+')',state.finished,'quiet')+'</div>').join('')):'');
 }
 return [DOT20Fire.WATER,DOT20Fire.ROOF,DOT20Fire.RACK].map((type,i)=>{
  const q=DOT20Fire.quote(s,type), key=['water','roof','rack'][i], action=['tank','roof','rack'][i];
  const effects=['Water supply for sprinklers','Less fire damage','Less damage to racked stock'];
  return d27Buy(type,fmt(q.cost),q.months+' '+(q.months===1?'month':'months'),esc(!q.available&&q.reason?q.reason:effects[i]),"orderFireProtection(\'"+action+"\')",!q.available||off(q.cost),'fire'+i,
   effects[i]+'. Sprinklers reduce damage, not the chance of a fire. '+(q.reason||''),'',null,'d21-upgrade-'+key);
 }).join('');
}
function d27RackStep(dx){
 const s=selectedSite();if(!s||state.finished)return;
 const cap=Math.min(s.sections*9-s.racks-s.projects.filter(p=>p.type==='Racking').length,Math.floor(state.player.cash/C.rack));
 D21.racks=clamp(Math.min(D21.racks??1,cap)+dx,1,Math.max(1,cap));render();
 document.querySelector('#d21-upgrade .d27-step button:'+(dx<0?'first':'last')+'-child')?.focus({preventScroll:true});
}
function d27Bank(){
 const c=state.player,q=v18LoanOffer(c), starter=d26StarterAvailable(c), dead=state.finished;
 const line=(label,value)=>'<div class="d27-cost"><span>'+label+'</span><strong>'+value+'</strong></div>';
 return d27Panel('<div class="d27-with-info"><h3>Borrow</h3>'+d27Info('loans','Borrowing','<p>8% annual rate, charged monthly. New loans run for 36 months. Business loan limits are based on eligible assets and the ability to repay.</p><p>Starter loans are free-play only, up to £100,000 in the first 12 months. Repaying them does not restore your allowance.</p>')+'</div>'+
  (d26FreePlay()?line('Starter loan available',fmt(starter))+d27Button('Borrow '+fmt(Math.min(starter,V18.drawStep)||V18.drawStep)+' starter cash','d26BorrowStarter()',dead||!starter,'wide'):'')+
  line('Business credit available',fmt(q.available))+d27Button('Borrow '+fmt(Math.min(q.available,V18.drawStep)||V18.drawStep),'borrow()',dead||!q.available,'wide'),'','d27-buy')+
 d27Panel('<div class="d27-with-info"><h3>Repay</h3>'+d27Info('repay','Repayment','<p>Repay up to £25,000 from available cash. Any scheduled loan repayments continue until the balance is cleared.</p>')+'</div>'+
  line('Loan balance',fmt(c.debt))+d27Button('Repay up to £25,000','repay()',dead||c.debt<=0||c.cash<=0,'wide'),'','d27-buy');
}
function d27Expansion(s){
 const c=state.player, q=d26FreePlay()?d26MortgageOffer(s):null, busy=s.projects.some(p=>p.type==='Expansion');
 return d27Buy('Site expansion',fmt(V18.extensionCost),EXPANSION_MONTHS+' months','+25,000 sq ft and one dock door','expand()',state.finished||busy||c.cash<V18.extensionCost,'extension','Cash purchase. Extra racking is separate. Monthly running costs increase by '+fmt(playerSiteOverhead({...s,sections:s.sections+1})-playerSiteOverhead(s))+'.',
  d27Button('View estimated cost and impact',"investmentForecast('Expansion')",false,'wide quiet')+(q?'<div class="d27-cost"><b>25-year mortgage</b>'+d27Info('mortgage','Extension mortgage','<p>'+fmt(q.deposit)+' deposit, about '+fmt(q.payment)+'/month over 25 years. You need six profitable months in a row and sufficient cash and recurring profit.</p>'+(q.reasons.length?'<ul>'+q.reasons.map(r=>'<li>'+esc(r)+'</li>').join('')+'</ul>':'') )+'</div>'+
  d27Button('Use extension mortgage','d26ConfirmMortgage()',!q.available,'wide quiet'):''),'Buy extension','d21-site-expansion');
}
function d27PopupScene(index,key,source){
 const s=state.player.sites[index], route=d21SceneRoutes[key];if(!s||!route)return;
 const forecastMoves=forecast(s), cap=siteCapacity(s,managementPenalty(state.player,s));
 const entry={
  docks:['Dock doors','Forecast pallet moves',forecastMoves,'Dock capacity',DOT17Facilities.dockCapacity(s,dot19ShiftCount(s))],
  handling:['Pallet handling','Forecast pallet moves',forecastMoves,'Handling capacity',cap],
  storage:['Pallet storage','Pallet spaces booked',occupancy(s),'Storage capacity',siteSpace(s)],
  'stock-levels':['Pallet storage','Pallet spaces booked',occupancy(s),'Storage capacity',siteSpace(s)],
  mhe:['MHE trucks','In service',dot19TruckCount(s,state.month),'Next month',dot19TruckTarget(s,state.month+1)],
  operations:['Ops managers','In post',s.managers||0,'Required',Math.floor(s.staff/10)],
  management:['Site team','Staff',s.staff,'Ops managers',s.managers||0],
  stock:['Stock manager','In post',s.stockController?'Yes':'No'],
  safety:['H&S manager','In post',s.hs?'Yes':'No'],
  tank:['Tank and pumps','Ready',DOT20Fire.view(s).water?'Yes':'No'],roof:['Roof sprinklers','Protection',DOT20Fire.view(s).roof?'Fitted':'Not fitted'],
  'rack-fire':['In-rack sprinklers','Protection',DOT20Fire.view(s).rack?'Fitted':'Not fitted'],
  automation:['Automation','Sections equipped',dot19Lanes(s,state.month).length],
  expansion:['Expansion','Warehouse sections',s.sections],projects:['Site work','Projects in progress',s.projects.length]
 }[key]||['Warehouse'];
 const row=(k,v)=>k?'<div class="d27-cost"><span>'+esc(k)+'</span><strong>'+(typeof v==='number'?num(v):esc(v))+'</strong></div>':'';
 const status=['docks','handling','storage','stock-levels'].includes(key)?d27Status(entry[2],entry[4]):null;
 const links=d27Button('View in '+(route[0]==='warehouse'?'Ops Office':'Invest'),'d27SceneGo('+index+',\''+key+'\')',false,'wide')+
  (key==='docks'||key==='storage'?d27Button('View in Ops Office','d27SceneGo('+index+',\''+(key==='docks'?'handling':'stock-levels')+'\')',false,'wide quiet'):'');
 d27Modal(entry[0],row(entry[1],entry[2])+row(entry[3],entry[4])+(status?'<b class="d27-chip '+status[0]+'">'+status[1]+'</b>':'')+links,source);
}
function d27SceneGo(index,key){const source=D27.modalFocus;d27Close(false);if(source)d21OpenSceneSection(index,key,source);}
function d27Rivals(){
 const firms=all().filter(c=>!c.bankrupt), idx=firm=>firm===state.player?'player':firm.name;
 const defaultRival=firms.find(c=>c!==state.player&&c.sites.some(s=>s.region===selected))||firms.find(c=>c!==state.player);
 const picks=[firms.find(c=>idx(c)===D27.pair[0])||state.player,firms.find(c=>idx(c)===D27.pair[1])||defaultRival];
 const cells=picks.map((c,i)=>'<div><select aria-label="'+(i?'Second operator':'First operator')+'" onchange="D27.pair['+i+']=this.value;render();document.querySelectorAll(\'.d27-compare select\')['+i+']?.focus()">'+firms.map(f=>'<option value="'+esc(idx(f))+'" '+(c===f?'selected':'')+'>'+esc(f===state.player?'You: '+f.name:f.name)+'</option>').join('')+'</select><b class="d27-operator-name">'+esc(c===state.player?'You · '+c.name:c?.name||'No rival')+'</b><span>'+esc(c?.ai?d23Type(c).label:'Your business')+'</span></div>');
 const metric=(label,fn)=>'<tr><th scope="row">'+label+'</th>'+picks.map(c=>'<td>'+(c?fn(c):'—')+'</td>').join('')+'</tr>';
 const table='<table class="d27-table d27-compare-table"><thead><tr><th scope="col">Measure</th><th scope="col">'+cells[0]+'</th><th scope="col">'+cells[1]+'</th></tr></thead><tbody>'+
 metric('Sites',c=>num(c.sites.length))+
 metric('Pallet spaces booked',c=>num(total(c,occupancy))+' / '+num(total(c,siteSpace)))+
 metric('Last month’s profit',c=>c.last?money(c.last.profit):'No results yet')+
 metric('Cash',c=>cash(c))+'</tbody></table>';
 return '<div class="d27-title"><h2 id="d17-screen-title" tabindex="-1">Rivals</h2></div>'+d27Panel('<h3>Compare operators</h3>'+table,'','d27-compare')+
  '<details class="d27-more"><summary>All operators &amp; investments</summary>'+d23PublicRivals()+rivalsView()+'</details>';
}
function d27Render(){
 const view=document.getElementById('view');
 D27.info.clear();document.body?.setAttribute('data-d27',tab);
 d27Header();
 const fn={office:d27Home,warehouse:d27Ops,investment:d27Investment,market:d27Bids,history:d27Finances,rivals:d27Rivals}[tab];
 view.innerHTML=fn();D21.renderedTab=tab;
}

const D27_OUTLINE='M95.2 201.3 L79.0 195.4 L65.7 195.8 L70.1 180.2 L65.7 164.7 L83.7 163.5 L106.8 181.4 L95.2 201.3 Z M162.0 214.8 L165.2 197.9 L150.5 179.7 L124.4 174.6 L119.2 166.7 L127.0 153.8 L120.0 145.8 L108.4 159.5 L107.1 131.5 L96.3 116.7 L104.1 86.8 L120.8 63.2 L138.0 65.5 L163.9 63.1 L140.9 94.5 L162.8 90.5 L186.4 90.6 L180.8 114.3 L161.4 140.3 L183.7 142.1 L204.5 179.4 L219.2 184.0 L232.5 217.1 L238.6 228.5 L264.7 234.1 L262.0 252.6 L251.1 261.1 L259.7 276.1 L240.3 291.3 L211.6 291.0 L175.0 299.0 L164.9 293.3 L150.7 306.9 L130.8 303.6 L115.7 314.7 L104.3 308.9 L135.8 278.4 L155.1 272.1 L121.3 267.3 L115.3 255.7 L137.7 246.8 L125.9 231.1 L130.0 212.1 L162.0 214.8 Z';

/* Portrait commercial desks: the decision is visible; the rules are opt-in. */
const d27DeskTitle=(name,help='')=>'<div class="d27-title"><h2 id="d17-screen-title" tabindex="-1">'+name+'</h2>'+help+'</div>';
const d27Choice=(label,action,on,id='')=>'<button type="button"'+(id?' id="'+id+'"':'')+' aria-pressed="'+on+'" onclick="'+action+'">'+label+'</button>';
const d27Numbers=rows=>'<dl class="d27-number-strip">'+rows.map(([l,v])=>'<div><dt>'+l+'</dt><dd>'+v+'</dd></div>').join('')+'</dl>';
function d27BidView(k){if(!['all','fit','mine'].includes(k))return;D27.bidView=k;render();document.getElementById('d27-bid-'+k)?.focus({preventScroll:true});}
function d27Bids(){
 const c=state.player,help=d27Info('bids-help','How Bids works','<p>Storage is priced per pallet per month. One pallet received or despatched counts as one move. The storage filter checks storage only, not staff or docks. Storage must be ready when the bid is awarded.</p><p>Price and reputation affect normal awards; trial contracts are ranked by price. One-month jobs use higher default rates and do not renew.</p>');
 const guide=d22Guide();
 const guideCard=guide?d27Panel('<div class="d27-with-info"><b>The First Contract</b>'+d27Info('first-contract','The First Contract',guide.replaceAll('onclick="','onclick="d27Close(false);'))+'</div>','','d27-guide-card'):'';
 const filtered=state.tenders.filter(t=>D27.bidView==='all'||(D27.bidView==='mine'?!!state.bids[t.id]:!!(state.bids[t.id]||availableSite(c,t))));
 const tiles=filtered.map(t=>{
  const i=state.tenders.indexOf(t), b=state.bids[t.id], fit=availableSite(c,t), forecast=t.spaces*(b?.storage??tenderDefault(t,'storage'))+t.moves*(b?.handling??tenderDefault(t,'handling'));
  const tone=b?'safe':fit?'safe':'close';
  const status=b?'Bid sent':fit?'Storage fits':owned(c,t.region).length?'Short on space':'No depot';
  return d27Panel('<div class="d27-tender-title"><div><h3>'+esc(d26TenderName(t))+'</h3><span>'+esc(regionOf(t.region).name)+' · '+esc(monthName(t.start))+' · '+num(t.term)+' '+(t.term===1?'month':'months')+'</span></div>'+
   '<span class="d27-chip '+tone+'">'+status+'</span></div>'+(t.spot?'<span class="d27-spot spot-badge">One-month storage job</span>':'')+
   d27Numbers([['Pallet spaces',num(t.spaces)],['Moves / month',num(t.moves)],['Est. revenue / month',fmt(forecast)]])+
   '<div class="d27-decision-actions">'+d27Info('fit'+i,'Storage fit for '+d26TenderName(t),d22FitHtml(t))+
   d27Button(b?'Review bid':fit?'Place bid':'View tender','d27Tender('+i+',this)',false,fit&&!b?'':'quiet')+'</div>','d27-tender-'+i,'d27-tender');
 }).join('');
 return '<div class="d27-commercial">'+d27DeskTitle('UK customer tenders',help)+guideCard+
 '<nav class="d27-choice" aria-label="Filter tenders">'+[['all','All'],['fit','Storage fits'],['mine','My bids']].map(([k,l])=>d27Choice(l,"d27BidView(\'"+k+"\')",D27.bidView===k,'d27-bid-'+k)).join('')+'</nav>'+
 '<div class="d27-decision-actions d27-bids-tools">'+d27Button('Default prices','d27BidDefaults(this)',false,'quiet')+
 d27Button('Bid on all that fit','d27BidAll(this)',state.finished,'quiet')+'</div>'+
 (tiles||d27Panel('<p>'+(D27.bidView==='mine'?'You have not placed any bids this month.':'No tenders match this filter.')+'</p>','','d27-empty'))+'</div>';
}
function d27BidDefaults(source){
 d27Modal('Default bid prices','<div class="d27-quote-fields"><label>Storage (£ / pallet / month)<input type="number" min="0" step=".1" value="'+standardRate('storage')+'" onchange="setRate(\'storage\',this.value)"></label>'+
 '<label>Pallet move (£ / move)<input type="number" min="0" step=".1" value="'+standardRate('handling')+'" onchange="setRate(\'handling\',this.value)"></label></div>',source);
}
function d27BidAll(source){
 d27Modal('Bid on all that fit?','<p>Submit default prices for every tender that fits your current storage. These bids do not reserve capacity.</p>'+
 d27Button('Submit default bids','d27Close(false);bidAll()',state.finished,'wide'),source);
}
function d27Tender(i,source){
 const t=state.tenders[i];if(!t)return;
 const id=esc(t.id), c=state.player,fit=availableSite(c,t),b=state.bids[t.id];
 const detail=d27Numbers([['Pallet spaces',num(t.spaces)],['Moves / month',num(t.moves)],['Starts',esc(monthName(t.start))]]);
 const markup=b?d27Numbers([['Your storage price','£'+b.storage],['Your move price','£'+b.handling]])+
  d27Button('Withdraw bid','d27FinishBid('+i+',true)',state.finished,'quiet wide'):
  fit?'<div class="d27-quote-fields"><label>Storage (£ / pallet / month)<input type="number" id="s-'+id+'" inputmode="decimal" min="0" step="any" placeholder="'+tenderDefault(t,'storage')+'" oninput="d27Quote(this)"></label>'+
  '<label>Pallet move (£ / move)<input type="number" id="h-'+id+'" inputmode="decimal" min="0" step="any" placeholder="'+tenderDefault(t,'handling')+'" oninput="d27Quote(this)"></label></div>'+
  '<p class="d27-estimate" id="q-'+id+'">Est. '+fmt(t.spaces*tenderDefault(t,'storage')+t.moves*tenderDefault(t,'handling'))+' / month</p>'+
  d27Button('Submit bid','d27FinishBid('+i+',false)',state.finished,'wide'):
  '<p class="d27-warning">'+esc(d22Fit(t).label)+'</p>';
 d27Modal(d26TenderName(t),'<div class="d27-tender-popup">'+detail+markup+'</div>',source);
}
function d27Quote(input){
 const id=input.id.slice(2),t=state.tenders.find(t=>t.id===id);if(!t)return;
 const get=(k,name)=>{const val=document.getElementById(k+'-'+id).value.trim();return val===''?tenderDefault(t,name):Number(val);};
 const space=get('s','storage'),moves=get('h','handling');
 document.getElementById('q-'+id).textContent=[space,moves].every(n=>Number.isFinite(n)&&n>=0)?'Est. '+fmt(t.spaces*space+t.moves*moves)+' / month':'Enter a valid, non-negative price.';
}
function d27FinishBid(i,withdraw){
 const t=state.tenders[i];if(!t||state.finished)return;
 if(withdraw)removeBid(t.id);else placeBid(t.id);
 if(!!state.bids[t.id]===withdraw)return;
 d27Close(false);document.querySelector('#d27-tender-'+i+' .d27-decision-actions .d27-button')?.focus({preventScroll:true});
}
function d27FinanceSwitch(k){
 if(!['trading','contracts','company'].includes(k))return;D27.financeView=k;render();document.getElementById('d27-fin-'+k)?.focus({preventScroll:true});
}
function d27Finances(){
 const c=state.player,r=c.last;
 const explain=d27Info('finance-help','How Finances works','<p>Profit includes the month’s interest but does not subtract loan principal repayments. Those reduce cash. Current cash can also change after the month closes when you buy, borrow or repay.</p><p>Revenue estimates on bids are not money already earned.</p>');
 const nav='<nav class="d27-choice" aria-label="Finance sections">'+[['trading','Trading'],['contracts','Contracts'],['company','Company']].map(([k,l])=>d27Choice(l,"d27FinanceSwitch(\'"+k+"\')",D27.financeView===k,'d27-fin-'+k)).join('')+'</nav>';
 const top=d27Panel('<h3>Profit &amp; cash</h3>'+d27Numbers([['Cash now',cash(c)],['Last month '+(r?.profit<0?'loss':'profit'),r?money(r.profit):'—'],['Loan balance',fmt(c.debt||0)]]),'','d27-fin-top');
 let main='';
 if(D27.financeView==='trading'){
  if(!r)main=d27Panel('<h3>Monthly financial results</h3><p>Complete a month to see results.</p>','','d27-fin-card');
  else {
   const costs=d22Drivers(r,c.history.at(-2)), revenue=(r.storage||0)+(r.handling||0), expense=-costs.filter(x=>x.value<0).reduce((n,x)=>n+x.value,0);
   const body=costs.filter(x=>x.value).map(x=>'<tr><th scope="row">'+esc(x.name)+'</th><td>'+money(x.value)+'</td></tr>').join('');
   main=d27Panel('<div class="d27-with-info"><h3>'+esc(monthName(r.month))+'</h3>'+d27Info('cost-help','Trading result','<p>Costs include labour, site overhead, safety, equipment, inspections, excess stock charges and loan interest. Cash change also includes loan principal and investment.</p>')+'</div>'+
    d27Numbers([['Revenue',fmt(revenue)],['Trading costs',fmt(expense)],['Moves completed',num(r.handled||0)+' / '+num(r.demand||0)]])+
    '<details><summary>Monthly financial results</summary><table class="d27-fin-ledger">'+body+
    '<tr><th scope="row">Loan amount repaid, excluding interest</th><td>'+fmt(r.principal||0)+'</td></tr>'+
    '<tr><th scope="row">Pallet moves requested</th><td>'+num(r.demand||0)+'</td></tr><tr><th scope="row">Pallet moves completed</th><td>'+num(r.handled||0)+'</td></tr></table></details>'+
    '<details><summary>Revenue and profit trend</summary>'+trendChart()+'</details>'+
    (r.incidents?.length?'<details><summary>Safety incidents · '+r.incidents.length+'</summary>'+incidentSummary(r)+'</details>':''),'','d27-fin-card');
  }
 }else if(D27.financeView==='contracts'){
  const list=c.sites.flatMap(s=>committed(s).map(k=>d27Panel('<h3>'+esc(d26TenderName(k))+'</h3><p>'+esc(s.name)+' · '+esc(monthName(k.start))+' to '+esc(monthName(k.end))+'</p>'+
   d27Numbers([['Spaces',num(k.spaces)],['Moves / month',num(k.moves)],['Storage / move','£'+k.storage+' / £'+k.handling]]),'','d27-fin-card'))).join('');
  main=list||d27Panel('<p>No customer contracts.</p>','','d27-empty');
 }else {
  main=d27Panel('<h3>Company</h3>'+d27Numbers([['Business value',fmt(valuation(c))],['Cash now',cash(c)],['Loan balance',fmt(c.debt||0)]])+
   '<div class="d27-decision-actions">'+d27Button('Borrowing',"d27Upgrade(\'bank\');goFromNav(\'investment\')")+d27Button('Rename business','renameBusiness()',false,'quiet')+
    d27Button('Start new game','confirmReset()',false,'danger')+'</div>','','d27-fin-card');
 }
 return '<div class="d27-commercial">'+d27DeskTitle('Finances',explain)+top+nav+main+'</div>';
}
