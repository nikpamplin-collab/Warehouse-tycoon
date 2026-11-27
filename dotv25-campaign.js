/* Authored starting situations; normal simulation settles every outcome. */
const D25_SCENARIOS={
 cash:{name:'Cash Squeeze',turns:8,goal:'Keep the inherited depot open. Finish with at least £125,000 cash and two profitable closing months.'},
 peak:{name:'Peak Contract',turns:6,goal:'Handle at least 98% of demand across peak turns 3–5 and finish with positive cash.'},
 region:{name:'Win Back the Region',turns:10,goal:'Win at least two Northern contracts, serve at least 95% of demand in the final month, and stay cash-positive.'}
};
function d25Options(){
 return '<label class="d25-mode" for="d25-mode">How do you want to play?</label><select id="d25-mode"><option value="sandbox">Open sandbox</option>'+Object.entries(D25_SCENARIOS).map(([id,s])=>'<option value="'+id+'">'+s.name+' · '+s.turns+' turns</option>').join('')+'</select>';
}
function d25Start(){
 const kind=document.getElementById('d25-mode').value;
 if(!Object.hasOwn(D25_SCENARIOS,kind))return;
 const g=state,c=g.player,s=c.sites[0];
 g.firstContract={mode:'sandbox',result:null};
 g.challenge={kind,started:g.month,result:null};
 const deal=(id,name,spaces,moves,storage,handling,start,end)=>({id,name,spaces,moves,storage,handling,start,end,segment:'Industrial',variableVolume:false});
 s.racks=kind==='cash'?3:kind==='peak'?7:8;
 s.staff=2;s.shiftStaff=[2,0,0];s.hs=true;
 c.cash=kind==='cash'?45000:kind==='peak'?140000:195000;
 s.contracts=[deal('scenario-base','Trent Wholesale',kind==='cash'?800:900,2400,kind==='cash'?34:29,8,1,kind==='cash'?4:16)];
 if(kind==='cash')s.contracts.push(deal('scenario-successor','Midlands Components',950,4500,29,9,5,14));
 if(kind==='peak')s.contracts.push(deal('scenario-peak','Fosse Retail peak',900,4400,25,7,3,5));
 if(kind==='region'){
  const n=site('north');n.name='Pennine DC';Object.assign(n,{racks:7,staff:2,shiftStaff:[2,0,0],hs:true});
  n.contracts=[deal('scenario-north','Pennine Tools',800,2100,31,8,1,15)];
  c.sites.push(n);
 }
 g.tenders=g.tenders.filter(t=>!t.id.startsWith('guide-'));
}
function d25Evaluation(g){
 const active=g.challenge;
 if(!active||!Object.hasOwn(D25_SCENARIOS,active.kind))return null;
 const c=g.player,months=c.history.filter(r=>r.month>=active.started),last=months.at(-1);
 function service(records){const [need,miss]=records.reduce(([a,b],r)=>[a+r.demand,b+r.missed],[0,0]);return need?Math.max(0,1-miss/need):0;}
 const pc=n=>Math.floor(n*1000+1e-8)/10+'%';
 let score=0,won=false,detail='';
 if(active.kind==='cash'){
  const run=months.slice(-2).filter(r=>r.profit>0).length;
  won=c.cash>=125000&&run===2;
  score=Math.min(100,Math.round(65*clamp(c.cash/125000,0,1)+17.5*run));
  detail=money(c.cash)+' cash · '+run+'/2 profitable closing months';
 }else if(active.kind==='peak'){
  const sr=service(months.filter(r=>r.month>=active.started+2&&r.month<=active.started+4));
  won=sr>=.98&&c.cash>0;score=Math.min(100,Math.round(85*clamp(sr/.98,0,1)+(c.cash>0?15:0)));
  detail=pc(sr)+' peak service · '+money(c.cash)+' cash';
 }else{
  const wins=new Set(c.sites.filter(s=>s.region==='north').flatMap(s=>s.contracts).filter(k=>!k.spot&&k.start>active.started&&k.start<=g.month&&k.id!=='scenario-north').map(k=>k.id)).size;
  const sr=service(last?[last]:[]);
  won=wins>=2&&sr>=.95&&c.cash>0;score=Math.min(100,Math.round(55*clamp(wins/2,0,1)+30*clamp(sr/.95,0,1)+(c.cash>0?15:0)));
  detail=wins+' Northern wins · '+pc(sr)+' last-month service · '+money(c.cash)+' cash';
 }
 const ended=!!g.finished||months.length>=D25_SCENARIOS[active.kind].turns;
 return {ended,won:ended&&won&&!g.finished,score:g.finished?0:ended&&!won?Math.min(score,99):score,detail,played:months.length};
}
function d25AfterMonth(){
 const active=state.challenge;if(!active||active.result)return;
 const attempt=d25Evaluation(state);
 if(attempt?.ended){active.result=attempt;state.events.unshift('CHALLENGE COMPLETE: '+D25_SCENARIOS[active.kind].name+' · '+(attempt.won?'target met':'target missed')+' · '+attempt.score+'/100.');}
}
function d25Challenge(){
 const active=state.challenge,brief=active&&D25_SCENARIOS[active.kind];
 if(!brief)return '';
 const a=active.result||d25Evaluation(state);
 return '<section class="d22-card" aria-label="Scenario progress"><h2>'+brief.name+'</h2><p>'+esc(brief.goal)+'</p><b>'+(a.ended?(a.won?'Target met':'Target missed')+' · '+a.score+'/100':a.played+'/'+brief.turns+' turns completed')+'</b><p>'+esc(a.detail)+'</p>'+(a.ended?'<small>Your score is recorded. Continue freely or start another challenge from the reset controls.</small>':'')+'</section>';
}
let d25BidFilter='all';
function d25SetFilter(mode){d25BidFilter=mode==='fit'?'fit':'all';render();document.getElementById('d25-bid-'+d25BidFilter)?.focus();}
function d25FilterToolbar(){
 return '<div class="d25-filter" aria-label="Filter tenders"><button type="button" id="d25-bid-all" aria-pressed="'+(d25BidFilter==='all')+'" class="btn secondary" onclick="d25SetFilter(\'all\')">All tenders</button><button type="button" id="d25-bid-fit" aria-pressed="'+(d25BidFilter==='fit')+'" class="btn secondary" onclick="d25SetFilter(\'fit\')">Fits my sites</button></div>';
}
function d25Tenders(){
 return d25BidFilter==='fit'?state.tenders.filter(t=>state.bids[t.id]||availableSite(state.player,t)):state.tenders;
}
function d25Portfolio(){
 const sites=state.player.sites;
 if(sites.length<2)return '';
 const rows=sites.map((s,i)=>'<li><strong>'+esc(s.name)+'</strong> · '+esc(regionOf(s.region).name)+
  '<br><small>'+num(occupancy(s))+' committed / '+num(siteSpace(s))+' pallet spaces · '+(s.last?'Latest site contribution '+money(s.last.profit):'No trading result yet')+'</small><br><button type="button" class="btn secondary" onclick="openMapSite('+i+')">Review site</button></li>');
 return '<details class="d22-card"><summary>How each site is performing</summary><p>Site contribution is before company management and financing. Contracts must fit in the region they serve.</p><ul class="list">'+rows.join('')+'</ul></details>';
}
