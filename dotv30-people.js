/* Recruitment and employed-team records. Example biographies never feed the simulation. */
const DOT30People=(()=>{
 const roles={
  ops:{name:'Operations manager',short:'Operations',info:'Reduces the likelihood of health and safety and stock issues, and modestly improves productivity for people and automation. Good people management supports workforce mood.'},
  safety:{name:'Health & safety manager',short:'Health & safety',info:'Significantly reduces the likelihood and severity of health and safety issues.'},
  stock:{name:'Stock manager',short:'Stock control',info:'Significantly reduces the likelihood and severity of stock issues.'}
 };
 const first=['Priya','Maya','Lewis','Tom','Mina','Asha','Dan','Sam','Nadia','George','Amina','Ravi','Rose','Elliot','Jules','Morgan','Hannah','Kai','Imani','Ellis','Sofia','Rory','Iona','Jai'];
 const last=['Shah','Okafor','Reed','Ellis','Patel','Khan','Price','Clarke','Diaz','Emery','Lin','Hughes','Fraser','Ng','Cole','Roberts','Taylor','Shaw','Kaur','Mills'];
 const quirks=['Believes pineapple belongs on pizza and is prepared to defend it at tribunal.','Collects miniature cars. Their model lorries have their own marked bays.','Takes a spirit level to a picnic. Refuses to call it a problem.','Has never been beaten at the office biscuit tin. It was not a contest.','Can identify twelve birds by sound, but not the reversing beeper outside.','Labels the cupboards at home. The cereal has its own pick face.','Maintains a model railway timetable more reliable than their morning train.','Has a spreadsheet for Sunday roast timings. Everyone still turns up early.','Owns four identical mugs, each marked “emergency use only”.','Insists the tea round has a critical path. Nobody has proved otherwise.'];
 const clampTo=(n,l,h)=>Math.max(l,Math.min(h,n));
 const validRole=r=>Object.hasOwn(roles,r);
 const known=s=>Array.isArray(s?.peopleHires)?s.peopleHires.filter(p=>p&&validRole(p.role)&&Number.isFinite(p.salary)):[];
 const flag=(s,r)=>r==='stock'?!!s.stockController:!!s.hs;
 const legacyCover=(s,r)=>r==='ops'?0:Number(s.peopleLegacyCover?.[r]??(!known(s).some(p=>p.role===r)&&flag(s,r)));
 const counts=(s,r)=>r==='ops'?(s.managers||0):known(s).filter(p=>p.role===r).length+legacyCover(s,r);
 const salaryBase=r=>r==='ops'?C.manager:r==='safety'?C.hs:DOT17_WORK.stockControlCost;
 const namesOfRole=(s,r)=>known(s).filter(p=>p.role===r).slice(0,counts(s,r));
 const avg=(a,f)=>a.length?a.reduce((n,p)=>n+f(p),0)/a.length:0;
 const mood=s=>Number.isFinite(s?.peopleMood)?clampTo(s.peopleMood,1,10):6;
 function hash(key){let x=2166136261;for(const c of key)x=Math.imul(x^c.charCodeAt(0),16777619);return x>>>0;}
 function rng(seed){let x=seed;return ()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296);}
 function market(g){
  const p=g.economy?.phase;
  return p==='bust'?{name:'Downturn',copy:'More strong candidates, lower salary asks.',scores:[5,7,8,9,9],price:.89}:
   p==='boom'?{name:'Boom',copy:'Fewer strong candidates, higher salary asks.',scores:[3,4,5,7],price:1.13}:
   p==='recovery'?{name:'Recovery',copy:'More candidates are returning to the market.',scores:[4,5,6,7,8],price:.95}:
   {name:'Steady market',copy:'A mix of experience and salary asks.',scores:[3,5,6,8,9],price:1};
 }
 function pool(g,s,r){
  if(!s||!validRole(r))return [];
  const conditions=market(g),month=g.month, seed=hash([g.player.sites[0]?.id,r,month].join('|')),random=rng(seed);
  const used=new Set(knownAcross(g).map(x=>x.id)), names=new Set(knownAcross(g).map(x=>x.name));
  for(const id of g.peoplePool?.month===month?(g.peoplePool.used||[]):[])used.add(id);
  return conditions.scores.map((q,i)=>{
   let name;
   for(let attempt=0;attempt<first.length*last.length;attempt++){
    const who=(seed+i*29+attempt*37)%(first.length*last.length);
    name=first[who%first.length]+' '+last[Math.floor(who/first.length)];
    if(!names.has(name))break;
   }
   names.add(name);
   const score=()=>clampTo(q+Math.round((random()-.5)*4),1,10);
   const p={id:'m'+month+'-'+r+'-'+i,role:r,name,avatar:Math.floor(random()*36),bio:Math.floor(random()*quirks.length),experience:score()};
   if(r==='ops'){p.people=score();p.safety=score();p.stock=score();}else p.skill=score();
   const level=r==='ops'?(.37*p.people+.22*p.safety+.22*p.stock+.19*p.experience):(.76*p.skill+.24*p.experience);
   p.salary=Math.round(salaryBase(r)*conditions.price*(s.region==='south'?1.1:1)*(.52+.079*level+random()*.035)/50)*50;
   return p;
  }).filter(x=>!used.has(x.id));
 }
 function knownAcross(g){return g.player.sites.flatMap(known);}
 function bumpStats(x,r,ref,role){
  if(x.last===ref.month)return;
  x.last=ref.month;x.months=(x.months||0)+1;
  if(role!=='stock'&&r.incident){
   x.safety=(x.safety||0)+1;
   const weight={Small:1,Medium:2,Large:3};
   if((weight[r.incident.severity]||0)>(weight[x.worstSafety]||0))x.worstSafety=r.incident.severity;
  }
  if(role!=='safety'&&r.stockLoss){
   x.stock=(x.stock||0)+1;x.worstStock=Math.max(x.worstStock||0,r.stockLoss.pallets||0);
  }
 }
 function snapshot(s,m,r){
  const hours=dot19Total(dot19Roster(s))*DOT19_OPS.hours;
  const kit=[...dot19Roster(s),dot19TruckCount(s,m),...dot19Lanes(s,m),Math.round((s.ci||1)*10000),DOT17Facilities.doorCount(s)].join(':');
  return {month:m,kit,hours,demand:Math.round(r.demand),handled:Math.round(r.handled)};
 }
 function record(s,m,r){
  if(s.peopleLastMonth===m)return;
  s.peopleLastMonth=m;
  const point=snapshot(s,m,r);
  for(const person of known(s)){
   const a=person.stats||={};
   bumpStats(a,r,point,person.role);
   if(person.role==='ops'&&point.hours>0&&point.demand>0&&!r.incident){
    const peers=(person.baseline||[]).filter(b=>b.kit===point.kit&&b.hours>0&&b.demand>0&&Math.abs(b.demand-point.demand)<=.2*point.demand);
    if(peers.length>=2){
     a.compare=(a.compare||0)+1;
     a.beforeMoves=(a.beforeMoves||0)+avg(peers,b=>b.handled/b.hours);
     a.afterMoves=(a.afterMoves||0)+point.handled/point.hours;
    }
   }
  }
  const legacy=team(s).filter(p=>p.legacy);
  if(legacy.length){
   s.peopleLegacyStats||={};
   for(const p of legacy)bumpStats(s.peopleLegacyStats[p.id]||={},r,point,p.role);
  }
  if(point.hours>0&&point.demand>0&&!r.incident)s.peopleTelemetry=[...(s.peopleTelemetry||[]).slice(-11),point];
  const before=mood(s),target=teamScore(s,'ops','people',.9);
  s.peopleMood=clampTo(before+DOT31Welfare.damp(s,clampTo((target-before)*.22,-.65,.65)),1,10);
  s.peopleMoodTrend=Math.abs(s.peopleMood-before)<.08?0:Math.sign(s.peopleMood-before);
 }
 function hire(g,s,r,id){
  if(g?.finished||!s||!g?.player?.sites.includes(s)||!validRole(r))return false;
  const candidate=pool(g,s,r).find(p=>p.id===id);if(!candidate)return false;
  if(r!=='ops'){
   const legacy=legacyCover(s,r)>0;
   s.peopleLegacyCover||={};s.peopleLegacyCover[r]=legacy;
  }
  const newPerson={...candidate,joined:g.month,stats:{},baseline:r==='ops'?[...(s.peopleTelemetry||[])]:[]};
  s.peopleHires=[...known(s),newPerson];
  if(r==='ops')s.managers=(s.managers||0)+1;
  else if(r==='safety')s.hs=true;else s.stockController=true;
  if(g.peoplePool?.month!==g.month||!Array.isArray(g.peoplePool.used))g.peoplePool={month:g.month,used:[]};
  g.peoplePool.used.push(id);
  return newPerson;
 }
 function release(g,s,r,id){
  if(g?.finished||!g?.player?.sites.includes(s)||!validRole(r))return false;
  const p=team(s).find(x=>x.id===id&&x.role===r);if(!p)return false;
  if(r!=='ops'){
   const legacy=legacyCover(s,r)>0;
   s.peopleLegacyCover||={};s.peopleLegacyCover[r]=legacy&&!p.legacy;
  }
  if(!p.legacy)s.peopleHires=known(s).filter(x=>x.id!==id);
  else if(s.peopleLegacyStats&&r!=='ops')delete s.peopleLegacyStats[id];
  else if(s.peopleLegacyStats){
   const range=Math.max(0,counts(s,r)-namesOfRole(s,r).length);
   const at=Number(id.split('-').at(-1));
   for(let i=at;i<range;i++){
    const x='legacy-'+r+'-'+i,y='legacy-'+r+'-'+(i+1);
    if(s.peopleLegacyStats[y])s.peopleLegacyStats[x]=s.peopleLegacyStats[y];else delete s.peopleLegacyStats[x];
   }
  }
  if(r==='ops')s.managers=Math.max(0,(s.managers||0)-1);
  else if(r==='safety')s.hs=counts(s,r)>0;else s.stockController=counts(s,r)>0;
  return p;
 }
 function team(s){
  return Object.keys(roles).flatMap(r=>{
   const named=namesOfRole(s,r);
   return [...named,...Array.from({length:Math.max(0,counts(s,r)-named.length)},(_,i)=>({id:'legacy-'+r+'-'+i,role:r,name:'Existing '+roles[r].name.toLowerCase(),salary:salaryBase(r),legacy:true,avatar:36+i,stats:s.peopleLegacyStats?.['legacy-'+r+'-'+i]}))];
  });
 }
 function salary(s,r){
  const deployed=namesOfRole(s,r);
  return deployed.reduce((n,p)=>n+p.salary,0)+Math.max(0,counts(s,r)-deployed.length)*salaryBase(r);
 }
 const proficiency=(p,k)=>.86*p[k]+.14*p.experience;
 const extraCover=n=>n>1?1-Math.pow(.68,n-1):0;
 function teamScore(s,r,k,cover=0){
  const named=namesOfRole(s,r), n=counts(s,r);
  if(!named.length)return 6; // Legacy-only sites keep their pre-upgrade behaviour.
  const mean=(named.reduce((sum,p)=>sum+proficiency(p,k),0)+(n-named.length)*6)/n;
  return clampTo(mean+cover*extraCover(n),1,10);
 }
 // Quality is averaged. Additional good coverage compounds, but the benefit is capped.
 function specialist(s,r){
  const named=namesOfRole(s,r),n=counts(s,r);
  if(!named.length)return {odds:1,severity:1};
  const score=teamScore(s,r,'skill');
  const cover=extraCover(n);
  const odds=(1+(6-score)*.09)*(1-.38*cover);
  const each=p=>r==='safety'?clampTo(.73+(6-proficiency(p,'skill'))*.067,.45,1):
   clampTo(.87+(6-proficiency(p,'skill'))*.06,.6,1.18);
  return {odds,severity:((named.reduce((sum,p)=>sum+each(p),0)+n-named.length)/n)*(1-.25*cover)};
 }
 function influence(s){
  const safety=specialist(s,'safety'),stock=specialist(s,'stock');
  const bias=k=>6-teamScore(s,'ops',k,.8);
  return {
   productivity:1+(mood(s)-6)*.014,
   safetyOdds:clampTo((s?.hs?.1:.4)*(1+bias('safety')*.065)*safety.odds,.025,.55),
   safetySeverity:safety.severity,
   stockOdds:(1+bias('stock')*.065)*stock.odds,
   stockSeverity:stock.severity
  };
 }
 function safetySeverity(s,roll){const x=influence(s).safetySeverity;return roll>=1-x/6?'Large':roll>=1-x*.5?'Medium':'Small';}
 function moodView(s){
  const n=mood(s), trend=s.peopleMoodTrend||0;
  const [icon,label]=n>=8.3?['😄','Happy']:n>=6.7?['🙂','Positive']:n>=4.8?['😐','Steady']:n>=3?['🙁','Low']:['😠','Unhappy'];
  return {icon,label,trend};
 }
 return Object.freeze({roles,market,pool,team,hire,release,salary,influence,safetySeverity,record,mood,moodView,quirks});
})();
