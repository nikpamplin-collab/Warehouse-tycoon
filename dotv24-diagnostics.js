/* Operational diagnostics from commissioned assets and the same model as Ops. */
function d24Diagnostic(s,{moves,capacity,occupied,spaces,fleet,assignments}){
 const rows=[];
 const sites=[...s.projects];
 const eff=managementPenalty(state.player,s);
 if(moves>capacity){
  const active=assignments.filter(x=>x.staff>0);
  const dock=active.length>0&&active.every(x=>x.dock<=x.workforce*eff);
  rows.push({type:dock?'dock':'handling',label:(dock?'Dock limit':'Handling shortfall')+' · '+num(moves-capacity)+' moves',detail:!active.length?'No staffed shift.':dock?'Every staffed shift is dock-limited.':'Check staffed output, equipment and dock headroom.',tone:'warn',route:dock?'docks':'handling'});
 }
 if(occupied>=spaces*.90&&spaces>0)
  rows.push({type:'storage',label:occupied>spaces?'Storage over capacity':'Storage nearly full',detail:num(occupied)+' committed / '+num(spaces)+' commissioned pallet spaces.',tone:'warn',route:'storage'});
 const assigned=Math.max(0,...assignments.map(x=>x.mhe));
 const idle=moves?Math.max(0,fleet-assigned):fleet;
 if(idle>0)rows.push({type:'idle',label:num(idle)+' leased forklift'+(idle===1?' idle':'s idle'),detail:moves?'No staffed shift requires these additional trucks.':'No signed handling work this turn.',tone:'info',route:'mhe'});
 if(sites.length)rows.push({type:'works',label:sites.length+' queued project'+(sites.length===1?'':'s'),detail:'Next completion in '+Math.min(...sites.map(p=>Math.max(1,p.remaining)))+' turn(s). Queued assets are not counted as live.',tone:'info',route:'projects'});
 if(!rows.length)rows.push({type:'clear',label:moves?'Within modelled capacity':'No signed work this turn',detail:moves?num(capacity-moves)+' spare handling moves at current staffing.':'Check Bids before adding labour or equipment.',tone:'ok',route:'handling'});
 return rows;
}
