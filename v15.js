/* DOTv15 adds a live warehouse cutaway. Forecasts, sites and projects are read only. */
(() => {
 'use strict';
 if(!window.WTVisual) return;
 const safe=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const num=x=>Math.round(x).toLocaleString('en-GB');
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const attr=x=>safe(x);
 const modes={floor:'Floor',flow:'Pallet flow',build:'Build queue'};
 function status(moves,capacity){return moves>capacity?['bad','Over capacity']:moves===0?['quiet','No moves committed']:moves>=capacity*.85?['watch','Near capacity']:['good','Capacity available'];}
 function gauge(label,val,max,unit){
  const pct=max?Math.round(val/max*100):val?100:0;
  const cls=val>max?'bad':pct>=85?'watch':'good';
  return `<div class="d13-gauge ${cls}"><div><b>${safe(label)}</b><span>${num(val)} / ${num(max)} ${unit}</span></div><div class="d13-meter" role="meter" aria-label="${attr(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${clamp(pct,0,100)}"><i style="width:${clamp(pct,0,100)}%"></i></div></div>`;
 }
 const projectData={
  Expansion:{tag:'Expansion',stages:['Fenced plot','Steel shell','Fit-out','Commissioning']},
  Racking:{tag:'Racking',stages:['Rack installation']},
  Automation:{tag:'Automation',stages:['Kit delivered','Equipment installation','Commissioning']},
  Replacement:{tag:'Replacement',stages:['Equipment removal','New kit installation','Commissioning']},
  CI:{tag:'Process improvement',stages:['Process review','Pilot changes','Rollout']},
  'Dock door':{tag:'Dock door',stages:['Fit-out']},
  Sprinklers:{tag:'Legacy sprinklers',stages:['Pipework','Commissioning']},
  'Tank and pumps':{tag:'Tank and pumps',stages:['Tank and pump house','Water commissioning']},
  'Roof sprinklers':{tag:'Roof sprinklers',stages:['Roof pipework','Commissioning']},
  'In-rack sprinklers':{tag:'In-rack sprinklers',stages:['Rack pipework and testing']}
 };
 const zones={
  storage:{icon:'racks',no:1,label:'Storage',id:'d15-investment'},
  docks:{icon:'docks',no:2,label:'Loading yard',id:'d15-operations'},
  office:{icon:'office',no:3,label:'Site office',id:'d15-staff'},
  works:{icon:'works',no:4,label:'Works zone',id:'d15-projects'}
 };
 const icons={
  racks:'M3 3h18v18H3z M3 9h18M3 15h18M9 3v18m6-18v18',
  docks:'M2 5h14v11H2z M16 9h3l3 4v3h-6 M5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm13 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  office:'M3 21V5h13v16m0-12h5v12M1 21h22M7 9h5m-5 4h5m-5 4h5',
  works:'M4 5h16M3 8h18v7H3z M7 8l-4 4m10-4l-7 7m13-7l-7 7m9-3l-3 3M6 15v5m12-5v5'
 };
 const fmtMonths=n=>`${num(n)} month${n===1?'':'s'}`;
 const nonNegative=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(0,n):0;
 function getProjects(v){
  return (Array.isArray(v.projects)?v.projects:[]).map(p=>{
   const spec=Object.hasOwn(projectData,p?.type)?projectData[p.type]:null;
   const left=Math.ceil(nonNegative(p?.remaining));
   const total=spec&&nonNegative(v.projectMonths?.[p.type]);
   const index=!total?0:clamp(Math.floor((total-left)*spec.stages.length/total),0,spec.stages.length-1);
   const section=Number.isInteger(p?.section)&&p.section>=0?p.section+1:null;
   return {type:spec?p.type:null,label:spec?.tag||'Site work',phase:total?spec.stages[index]:'Work scheduled',index,left,section,total};
  });
 }
 function warehouse(v){
  const mode=Object.hasOwn(modes,v.mode)?v.mode:'floor';
  const forecast=nonNegative(v.moves), capacity=nonNegative(v.capacity), projects=getProjects(v);
  const [loadClass,loadName]=status(forecast,capacity);
  const load=capacity?forecast/capacity:forecast?2:0, queued=forecast>capacity;
  const work=projects.find(p=>p.type==='Expansion');
  const automationWork=projects.find(p=>p.type==='Automation'||p.type==='Replacement');
  const incident=typeof v.last?.incident?.severity==='string'?v.last.incident.severity:null;
  const lastMissed=nonNegative(v.last?.missed);
  const peopleConcern=Number.isFinite(v.managers)&&v.managers<Math.floor(v.staff/10);
  const index=Number.isInteger(v.siteIndex)&&v.siteIndex>=0?v.siteIndex:null;
  const pt=(x,y,z=0)=>(323+(x-y)*22)+','+(79+(x+y)*11-z);
  const face=(ps,fill,stroke='#242f3e',w=1.35)=>`<polygon points="${ps.map(p=>pt(...p)).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round"/>`;
  const ground=(x,y,w,d,z,fill,line,width)=>face([[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z]],fill,line,width);
  const box=(x,y,w,d,h,c,z=0)=>face([[x,y+d,z+h],[x+w,y+d,z+h],[x+w,y+d,z],[x,y+d,z]],c[1])+face([[x+w,y,z+h],[x+w,y+d,z+h],[x+w,y+d,z],[x+w,y,z]],c[2])+ground(x,y,w,d,z+h,c[0]);
  const line=(ps,color,width=1,dash='')=>`<polyline points="${ps.map(p=>pt(...p)).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${dash?' stroke-dasharray="'+dash+'"':''}/>`;
  const wall=(x,y,w,h)=>face([[x,y,6],[x+w,y,6],[x+w,y,h],[x,y,h]],'#6f96a6','#273c4c');
  const chip=(x,y,z,msg,w)=>{const [a,b]=pt(x,y,z).split(',').map(Number);return `<g><rect x="${a-w/2}" y="${b-15}" width="${w}" height="24" rx="6" fill="#132535" stroke="#ebc375"/><text x="${a}" y="${b+1}" text-anchor="middle" fill="#fff4d9" font-size="11" font-weight="700">${safe(msg)}</text></g>`;};
  let art=ground(-1,-3.3,16.9,16.9,-5,'#3b5e55','#6f8271',2)+box(-.4,-.25,11.1,11.1,4,['#6e8080','#253c43','#3b4d53']);
  art+=ground(.45,.55,9.6,7.3,5,'#d4c8a4','#7d806f',1.4);
  for(let x=.45;x<10;x+=.8)art+=line([[x,.55,5.2],[x,7.8,5.2]],'#b7ad93',.65);
  for(let y=.55;y<8;y+=.8)art+=line([[.45,y,5.2],[10.05,y,5.2]],'#b7ad93',.65);
  art+=wall(.45,.55,9.6,55)+face([[.45,.55,6],[.45,7.85,6],[.45,7.85,32],[.45,.55,55]],'#9eb4b5','#2f4654');
  art+=line([[.45,7.83,32],[.45,.55,55],[10.05,.55,55]],'#d8d8bc',3);
  for(let i=0;i<4;i++){let x=1+i*2.15;
   art+=face([[x,.55,32],[x+1.35,.55,32],[x+1.35,.55,46],[x,.55,46]],'#20384b');
   art+=face([[x+.07,.55,33],[x+1.28,.55,33],[x+1.28,.55,44],[x+.07,.55,44]],'#b5e5e2','#416479');
   art+=line([[x+.68,.55,33],[x+.68,.55,44]],'#588b92');
  }
  art+=ground(.6,6.01,9.1,.19,5.5,'#e9ad56','#b78e59',.6);
  art+=ground(.6,7.56,9.1,.12,5.5,'#efe4bb','#8f936f',.6);
  const wings=clamp(v.sections-1,0,2);
  for(let i=0;i<wings;i++){
   const x=10.1+i*.91,y=.65+i*.85;
   art+=box(x,y,.86,5.55-i*.55,21-i*3,['#8faeb3','#56757a','#3f5560']);
   art+=line([[x+.34,y,22-i*3],[x+.34,y+5.45-i*.55,22-i*3]],'#dbdac1',1.4);
  }
  if(v.sections>3&&mode==='floor')art+=chip(11.27,2.64,40,num(v.sections)+' sections',78);
  const racks=clamp(Math.round(v.racks),0,27), represented=Math.min(racks,18);
  const occupied=clamp(v.spaces?v.occupied/v.spaces:0,0,1);
  const loaded=Math.round(represented*2*occupied), rackPoints=[];
  for(const y of [1.55,3.0,4.48])for(let x=1.35;x<8.5;x+=1.203)rackPoints.push([x,y]);
  rackPoints.sort((a,b)=>a[0]+a[1]-b[0]-b[1]||a[1]-b[1]);
  for(let i=0;i<represented;i++){
   const [x,y]=rackPoints[i], depth=.72, w=.94;
   art+=ground(x+.04,y+.11,w+.18,depth+.10,5.7,'#afa187','#aa9c82',.5);
   for(let level=0;level<2;level++){
    const z=8+level*13;
    art+=box(x,y,w,depth,1.9,['#f3b86e','#965640','#7a4644'],z);
    if(i*2+level<loaded)art+=box(x+.1,y+.05,w*.72,depth*.8,8,[i%3?'#dda65c':'#dbb786','#a16d42','#7e5442'],z+2.1);
   }
   for(const a of [[x,y+depth],[x+w,y+depth],[x+w,y]])art+=line([[...a,7],[...a,33]],'#32536b',2.2);
   art+=line([[x,y+depth,32],[x+w,y+depth,32],[x+w,y,32]],'#7091a4',2);
  }
  if(!represented&&v.occupied)art+=box(2,5.25,1.15,.8,10,['#f0c284','#a47552','#805b4b'],5);
  if(v.automated){
   art+=box(8.55,1.65,1.1,3.8,9,['#6bc7b3','#397f80','#2e5c68'],5);
   for(let y=1.83;y<5.2;y+=.5)art+=line([[8.64,y,15],[9.5,y,15]],'#d6f3cf',1);
   art+=box(8.77,3.0,.62,.62,10,['#fae0a2','#b6ac6f','#71694e'],14);
  }
  for(let i=0;i<Math.min(6,Math.ceil(v.staff/3));i++){
   const [x,y]=pt(1.35+i*1.18,6.62,6).split(',').map(Number);
   art+=`<g><ellipse cx="${x}" cy="${y+1}" rx="6" ry="2.2" fill="#3c4843" opacity=".45"/><path d="M${x-2.3} ${y}v-7m4 7v-7" stroke="#263744" stroke-width="2.1"/><path d="M${x-4} ${y-6}v-7q4-4 8 0v7z" fill="#efae5c" stroke="#743f36"/><circle cx="${x}" cy="${y-16}" r="3" fill="#fce0a4" stroke="#78584a"/></g>`;
  }
  const docks=[2,4.8,7.6].slice(0,clamp(v.dockDoors ?? 3,2,3));
  docks.forEach((x,i)=>{
   art+=ground(x-.17,8,1.4,2.6,4.3,i===2?'#4b826d':'#5c6b70','#c6b58e',1.05);
   art+=box(x,7.77,1.05,.47,13,['#a2b5b0','#293e4d','#4b6168'],4);
   for(let j=0;j<3;j++)art+=line([[x+.16,8.25,7+j*2.2],[x+.94,8.25,7+j*2.2]],'#849399',.9);
  });
  // Iconic trucks show forecast pressure, never tracked entities. Yards and routes are schematic.
  art+=ground(.6,10.74,12.9,2.45,3.8,'#505e65','#84917d');
  art+=line([[.8,11.95,4],[13.3,11.95,4]],'#d1c98d',1.15,'7 5');
  const truck=(x,y,alt)=>box(x,y,1.08,1.35,18,['#f5eed4','#c7ccba','#899895'],4)
   +box(x,y+1.35,1.08,.69,12,[alt?'#82a8bd':'#ffb45f',alt?'#517e91':'#b3774e','#49656e'],4)
   +line([[x+.13,y+2.05,12],[x+.93,y+2.05,12]],'#193e55',2)
   +[y+.24,y+1.66].map(a=>{const [wx,wy]=pt(x+1.08,a,6).split(',');return `<ellipse cx="${wx}" cy="${wy}" rx="3.5" ry="4.3" fill="#22323b"/>`;}).join('');
  const dockUse=forecast?clamp(Math.ceil(load*docks.length),1,docks.length):0;
  docks.slice(0,dockUse).forEach((x,i)=>{art+=`<g class="d15-docked" data-dock="${i+1}">${truck(x,8.31,i%2)}</g>`;});
  if(queued){
   art+=line([[9.18,10.9,5],[12.75,10.9,5]],'#f4bb75',2.4,'4 3');
   art+=`<g class="d15-queue">${truck(9.35,10.45,0)}${truck(11.05,10.45,1)}</g>`;
  }else if(forecast&&(mode==='flow'||load>=.25)){
   art+=`<g class="d15-yard-truck">${truck(5.85,10.8,1)}</g>`;
  }
  const forklift=(x,y)=>box(x,y,.78,.53,8,['#fbd476','#d7924f','#8d5f46'],5)
   +line([[x+.78,y+.08,6],[x+.78,y+.08,17],[x+.78,y+.39,17],[x+.78,y+.39,6]],'#344851',2)
   +line([[x+.78,y+.1,7],[x+1.03,y+.1,7]],'#1b343d',1.6)+line([[x+.78,y+.38,7],[x+1.03,y+.38,7]],'#1b343d',1.6);
  if(v.staff&&forecast){
   art+=`<g class="d15-lift d15-lift-a">${forklift(5.8,5.49)}</g>`;
   if(v.staff>=6&&load>=.65)art+=`<g class="d15-lift d15-lift-b">${forklift(2.2,5.50)}</g>`;
  }
  // Site office: explicit on-screen staffing signal, not an engine calculation.
  art+=box(.68,6.85,1.45,.98,20,[peopleConcern?'#eabc81':'#93c4c9','#386377','#355769'],5);
  art+=face([[.75,7.84,13],[1.42,7.84,13],[1.42,7.84,20],[.75,7.84,20]],'#bce6d9','#355769');
  art+=line([[1.58,7.84,8],[1.58,7.84,20],[1.97,7.84,20],[1.97,7.84,8]],'#e1ddc2',1.2);
  if(v.hs)art+=line([[.93,7.85,16.3],[1.23,7.85,16.3]],'#397764',1.7)+line([[1.08,7.85,14.3],[1.08,7.85,18.3]],'#397764',1.4);
  if(mode==='flow'){
   art+=line([[2.5,8.7,7],[2.5,6.2,7],[7.75,6.2,7],[7.75,3.65,6]],queued?'#df6b66':'#36e0ca',3.8,'8 5');
   art+=chip(2.6,8.7,23,'Docks',56)+chip(7.75,3.65,41,'Put-away',73);
  }
  const marker=(n,x,y,z)=>{const [px,py]=pt(x,y,z).split(',');return `<g aria-hidden="true"><circle cx="${px}" cy="${py}" r="11.5" fill="#112936" stroke="#ffdd91" stroke-width="1.7"/><text x="${px}" y="${Number(py)+4}" text-anchor="middle" fill="#fff4d9" font-size="11" font-weight="750">${n}</text></g>`;};
  if(projects.length){
   // Work is confined to a non-operational footprint. Opening new capacity is the engine's job.
   const [x,y,w,d]=work?[12.3,.65,2.65,4.66]:[8.72,4.52,1.25,1.37];
   art+=ground(x,y,w,d,5.8,'#96745a','#e6be7a',1.6);
   art+=line([[x,y,7],[x+w,y,7],[x+w,y+d,7],[x,y+d,7],[x,y,7]],'#ffda7e',2,'4 3');
   if(work&&work.index>=1){
    const posts=[[x+.2,y+.2],[x+w-.2,y+.2],[x+.2,y+d-.2],[x+w-.2,y+d-.2]];
    for(const [px,py] of posts)art+=line([[px,py,7],[px,py,38]],'#e3b985',3);
    art+=line(posts.slice(0,2).map(([px,py])=>[px,py,38]),'#ead7aa',3);
    art+=line([[x+w-.2,y+.2,38],[x+w-.2,y+d-.2,38],[x+.2,y+d-.2,38]],'#e8ce9c',3);
    art+=line([[x+w-.2,y+.2,38],[x+w-.2,y+d-.2,13]],'#e8ce9c',1.4);
    if(work.index>=2)art+=box(x+.24,y+.37,w-.50,d-.77,7,['#8aafb1','#59777e','#476a6e'],5.8)+box(x+.52,y+.9,.64,d-1.77,14,['#f3cd79','#a67a4b','#86594b'],12);
    if(work.index>=3)art+=ground(x+.2,y+.2,w-.4,d-.4,38,'#8caaac','#ead7aa',1.4)+line([[x+.25,y+2.05,39],[x+w-.25,y+2.05,39]],'#e4d5ad',1.2);
   }else{
    art+=box(x+.16,y+.22,.56,.54,5,['#e7bc77','#9d724a','#84594b'],6);
    if(work)art+=box(x+.95,y+2.08,.95,1.42,7,['#caba8f','#8b755b','#7e6a56'],6);
    else if(automationWork)art+=box(x+.55,y+.68,.52,.53,automationWork.index?12:7,['#6bc7b3','#397f80','#2e5c68'],6);
    else if(projects.some(p=>p.type==='Racking'))art+=line([[x+.2,y+.75,6],[x+.2,y+.75,20],[x+.99,y+.75,20],[x+.99,y+.75,6]],'#6ca1ae',2.1);

   }
   if(automationWork&&work)art+=box(8.83,4.92,.60,.54,automationWork.index?13:7,['#6bc7b3','#397f80','#2e5c68'],6);
  }
  if(mode==='floor')art+=marker(1,4.6,2.2,47)+marker(2,5.35,9.42,31)+marker(3,1.05,7.4,33)+(projects.length?marker(4,work?13.45:9.25,work?2.8:5.2,work?47:36):'');
  const fire=v.fireProtection;
  if(fire&&mode!=='flow'){
   const active='#83ccb7', pending='#f5bb72';
   if(fire.water||fire.waterWorks){
    const [tx,ty]=pt(-.35,2.4,6).split(',').map(Number),stroke=fire.water?active:pending;
    const tank=`<g class="d20-water-tank"><title>External water tank</title><path d="M${tx-14} ${ty-34} v26 c0 11 28 11 28 0 v-26z" stroke="${stroke}" stroke-width="2" fill="#345a6c"/><ellipse cx="${tx}" cy="${ty-34}" rx="14" ry="5" fill="#5f8997" stroke="${stroke}" stroke-width="2"/><path d="M${tx+6} ${ty-30}v19" stroke="#a0c4c5" stroke-width="1"/></g>`;
    art+=`<g class="d20-water-works">${tank}<g class="d20-pump-house"><title>Pump house</title>${box(-.9,3.6,1.05,.85,15,['#81a6a5','#3c646b','#2c4d5b'],5)}${line([[.09,4.45,8],[.09,4.45,17]],stroke,2)}</g>${line([[-.2,2.65,9],[-.2,3.77,9],[.45,3.77,9]],stroke,2,fire.water?'':'3 3')}</g>`;
   }
   if(fire.roof||fire.roofWorks){
    const colour=fire.roof?active:pending;
    art+=`<g class="d20-roof-pipework"><title>Roof-level sprinkler pipework</title>`;
    art+=line([[1.15,.78,50],[9.45,.78,50]],colour,3,fire.roof?'':'5 4');
    for(const x of [2.1,4.7,7.3,9.4])art+=line([[x,.78,50],[x,.78,45],[x+.22,.78,45]],fire.roof?'#baf2da':pending,2);
    art+='</g>';
   }
   if(fire.rack||fire.rackWorks){
    const colour=fire.rack?active:pending;
    const fraction=fire.rack&&fire.sections?fire.rack/fire.sections:1;
    art+=`<g class="d20-rack-pipework"><title>In-rack sprinkler lines</title>`;
    for(const [x,y] of rackPoints.slice(0,Math.ceil(represented*fraction))){
     art+=line([[x+.09,y+.63,7],[x+.09,y+.63,27],[x+.82,y+.63,27]],colour,1.8,fire.rack?'':'3 2');
     art+=line([[x+.44,y+.63,27],[x+.44,y+.63,24]],colour,1.6);
    }
    art+='</g>';
   }
  }
  const fireLegend=fire&&['water','roof','rack'].some(k=>fire[k]||fire[k+'Works'])
    ? `<div class="d20-fire-key" aria-label="Fire protection legend">${[['water','Tank and pumps'],['roof','Roof pipework'],['rack','In-rack pipework']].filter(([k])=>fire[k]||fire[k+'Works']).map(([k,label])=>`<span class="${fire[k+'Works']?'pending':'complete'}">${label}: ${fire[k+'Works']?(fire[k]?'existing and fit-out':'fit-out'):'commissioned'}</span>`).join('')}</div>` : '';
  if(mode==='flow'&&incident)art+=chip(1.7,7.95,46,v.last.incident.kind==='Fire'?'Last month: Fire':'Last month: H&S',113);
  if(mode==='flow'&&queued)art+=chip(11.55,11.4,30,'Queue risk',78);
  if(mode==='build'&&projects.length)art+=marker(4,work?13.45:9.25,work?2.8:5.2,work?47:36);
  const info=mode==='flow'?gauge('Handling forecast',forecast,capacity,'moves/mo'):mode==='build'?(
   `<div class="d15-work"><h3>Project board</h3>${projects.length?`<ul>${projects.map(p=>`<li><span><b>${safe(p.label)}${p.section?` · Section ${p.section}`:''}</b><small>${safe(p.phase)}</small></span><strong>${fmtMonths(p.left)} left</strong></li>`).join('')}</ul>`:'<p>No investment work is queued.</p>'}</div>`
  ):gauge('Storage committed',v.occupied,v.spaces,'pallets');
  const details={
   storage:`${num(v.occupied)} / ${num(v.spaces)} pallets committed`,
   docks:!forecast?'No forecast moves':queued?`${num(forecast-capacity)} moves above forecast capacity`:`${num(forecast)} forecast moves / month`,
   office:`${num(v.staff)} people${v.hs===undefined?'':v.hs?' · H&S covered':' · No H&S manager'}`,
   works:projects.length?`${num(projects.length)} active project${projects.length===1?'':'s'}`:'No work queued'
  };
  const zoneLinks=Object.entries(zones).map(([key,z])=>`<a class="d15-tool" href="#${z.id}"${index===null?'':` data-d15-open-site="${index}"`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[z.icon]}" /></svg><span><b>${z.no}. ${z.label}</b><small>${details[key]}</small></span></a>`).join('');
  const latest=v.last?`<p class="d15-last"><b>Last month:</b> ${num(nonNegative(v.last.handled))} handled · ${num(lastMissed)} missed${incident?` · ${safe(incident)} H&amp;S incident`:''}</p>`:'';
  return `<figure class="d13-yard d15-yard"><div class="d13-yard-title"><span class="d13-kicker">OPERATIONS YARD</span><span class="d13-pill ${loadClass}">${loadName}</span></div>
  <svg class="d15-scene" viewBox="0 0 650 375" role="img" aria-label="Warehouse cutaway: ${num(v.racks)} installed racking units, ${num(v.staff)} staff, ${num(v.sections)} operational sections${queued?`, forecast queue risk`:''}${work?`, expansion at ${safe(work.phase)}`:''}">
  <defs><linearGradient id="d15-sky" x2="0" y2="1"><stop stop-color="#263e52"/><stop offset="1" stop-color="#4b666a"/></linearGradient><pattern id="d15-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" stroke="#b4d9d1" fill="none" opacity=".12"/></pattern></defs>
  <rect width="650" height="375" fill="url(#d15-sky)"/><rect width="650" height="375" fill="url(#d15-grid)"/>
  <path d="M0 225Q97 152 172 207T345 193T650 173V375H0Z" fill="#2b4c4c" opacity=".53"/>${art}</svg>
  <figcaption class="d13-yard-caption"><div class="d13-layer-buttons" aria-label="Warehouse view">${Object.entries(modes).map(([key,label])=>`<button class="d13-mode" data-scene-mode="${key}" aria-pressed="${key===mode}">${label}</button>`).join('')}</div>${info}${fireLegend}${latest}<nav class="d15-action-tray" aria-label="Warehouse controls">${zoneLinks}</nav><div class="d13-metadata"><span><b>${num(v.racks)}</b> racking units</span><span><b>${num(v.staff)}</b> staff</span><span><b>${num(v.sections)}</b> sections</span>${v.automated?`<span><b>${num(v.automated)}</b> automated</span>`:''}</div></figcaption></figure>`;
 }
 window.WTVisual={...window.WTVisual,warehouse};
})();
