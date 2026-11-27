/* Operational diagnostics from commissioned assets and the same model as Ops. */
function d24Diagnostic(s,{moves,capacity,occupied,spaces,fleet,assignments}){
 const rows=[];
 const sites=[...s.projects];
 const eff=managementPenalty(state.player,s);
 if(moves>capacity){
  const active=assignments.filter(x=>x.staff>0);
  const dock=active.length>0&&active.every(x=>x.dock<=x.workforce*eff);
  rows.push({type:dock?'dock':'handling',label:(dock?'Dock doors limit output · ':'')+num(moves-capacity)+' moves over capacity',detail:!active.length?'No staff on shift.':dock?'On every staffed shift, the docks can handle no more moves than the team.':'Check staff, forklifts and spare dock capacity.',tone:'warn',route:dock?'docks':'handling'});
 }
 if(occupied>=spaces*.90&&spaces>0)
  rows.push({type:'storage',label:occupied>spaces?'Storage over capacity':'Storage nearly full',detail:num(occupied)+' booked this month / '+num(spaces)+' pallet spaces ready to use.',tone:'warn',route:'storage'});
 const assigned=Math.max(0,...assignments.map(x=>x.mhe));
 const idle=moves?Math.max(0,fleet-assigned):fleet;
 if(idle>0)rows.push({type:'idle',label:num(idle)+' leased forklift'+(idle===1?' idle':'s idle'),detail:moves?'No shift needs these additional forklifts.':'No pallet moves forecast this month.',tone:'info',route:'mhe'});
 if(sites.length)rows.push({type:'works',label:sites.length+' project'+(sites.length===1?' in progress':'s in progress'),detail:'Next completion in '+Math.min(...sites.map(p=>Math.max(1,p.remaining)))+' months. Work in progress does not add capacity yet.',tone:'info',route:'projects'});
 if(!rows.length)rows.push({type:'clear',label:moves?'Forecast fits capacity':'No pallet moves forecast this month',detail:moves?'Capacity for '+num(capacity-moves)+' more moves with current staffing.':'Check Bids before adding labour or equipment.',tone:'ok',route:'handling'});
 return rows;
}
