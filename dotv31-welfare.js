/* Site welfare. A purchase installs immediately; only the incremental mood boost is awarded. */
const DOT31Welfare=(()=>{
 const options=[
  {id:1,name:'Basic canteen',price:20000,credit:15000,features:'Seating, kettle and cold-food counter',benefit:'A modest boost and some protection against falling mood.'},
  {id:2,name:'Hot-food canteen',price:50000,credit:40000,features:'Hot meals, serving counter and seating',benefit:'A bigger boost and better protection against falling mood.'},
  {id:3,name:'Staff lounge',price:125000,credit:0,features:'Hot food, pool table and PlayStation',benefit:'The strongest boost and protection against falling mood.'}
 ];
 const bounds=(n,a,b)=>Math.max(a,Math.min(b,n)),boost=[0,.50,.95,1.45],cushion=[0,.16,.32,.48];
 const tier=s=>Number.isInteger(s?.welfareTier)?bounds(s.welfareTier,0,options.length):0;
 const installed=s=>options[tier(s)-1]||null;
 function quote(s,id){
  if(!s||!Number.isInteger(id))return null;
  const next=options[id-1],old=installed(s);
  if(!next||id<=tier(s))return null;
  const credit=old?.credit||0;
  return {next,credit,cost:next.price-credit};
 }
 function buy(g,s,id){
  const q=quote(s,id);
  if(!q||g?.finished||!g?.player?.sites.includes(s)||!Number.isFinite(g.player.cash)||g.player.cash<q.cost)return false;
  const before=DOT30People.mood(s),old=tier(s);
  g.player.cash-=q.cost;
  s.welfareTier=id;s.welfareBoughtMonth=g.month;
  s.peopleMood=bounds(before+boost[id]-boost[old],1,10);
  if(s.peopleMood>before)s.peopleMoodTrend=1;
  return q;
 }
 // Welfare softens a fall; it does not boost mood every month or change its eventual level.
 const damp=(s,delta)=>delta<0?delta*(1-cushion[tier(s)]):delta;
 return Object.freeze({options:Object.freeze(options.map(Object.freeze)),tier,installed,quote,buy,damp});
})();
