/* Label-free site drawing. Coordinates and counts are display-only, never game inputs. */
const DOT21Yard=(()=>{
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const num=n=>Math.round(n).toLocaleString('en-GB');
 const count=n=>Number.isFinite(n)?Math.max(0,Math.floor(n)):0;
 const cap=(n,a,b)=>Math.max(a,Math.min(b,n));
 const panels={floor:'Warehouse',flow:'Pallet flow',build:'Build queue'};
 const names={'Racking':'Racking','Expansion':'Expansion','Automation':'Automation','Replacement':'Automation replacement','CI':'Process improvement','Dock door':'Dock door','Tank and pumps':'Tank and pumps','Roof sprinklers':'Roof sprinklers','In-rack sprinklers':'In-rack sprinklers','Sprinklers':'Legacy sprinklers'};
 const colours={slab:['#bcbab0','#86847a','#6d716b'],steel:['#637581','#465b69','#354654'],blue:['#4b7189','#355369','#2c455c'],beam:['#d27a49','#ad532e','#88391c'],wood:['#c39560','#aa7748','#8d5e38'],goods1:['#dac19b','#bb986c','#a28157'],goods2:['#d0ae7b','#b08b59','#977446'],goods3:['#dec9a6','#c4a984','#a88f6b'],warm:['#f0bd55','#d18b32','#ac6429'],dark:['#4b534b','#343f38','#27362d'],clad:['#e1ddcf','#c1c1b6','#a9b0a5'],mint:['#88a997','#608471','#476b59'],tank:['#819c8f','#49786d','#335e55']};
 const layout=[
  [4,12.7],[7.2,12.7],[10.4,12.7],[4,6.4],[7.2,6.4],[10.4,6.4],
  [20.1,12.7],[23.3,12.7],[26.5,12.7],[20.1,6.4],[23.3,6.4],[26.5,6.4]
 ];
 function proportion(n,d){return d>0?cap(n/d,0,1):0;}
 function model(v){
  const rackMax=Math.max(1,count(v.sections))*9;
  const fit=proportion(count(v.racks),rackMax), fill=proportion(count(v.occupied),count(v.spaces));
  const bays=fit?cap(Math.round(layout.length*fit),1,layout.length):0;
  const positions=bays*8||12, loads=Math.round(fill*positions);
  const order=Array.from({length:positions},(_,i)=>i).sort((a,b)=>{
   const priority=i=>positions===12?i:(i%8)*93+(i%8)*11+((i>>3)*7)%12;
   return priority(a)-priority(b);
  });
  const floorMode=bays===0;
  const fleet=Math.min(3,count(v.trucks));
  const assigned=Math.min(fleet,count(v.assignedTrucks));
  return {fit,fill,bays,positions,loads,loaded:new Set(order.slice(0,loads)),fleet,assigned,floorMode};
 }
 // An orthogonal footprint with two visible wall faces and genuine clearance aisles.
 const P=(x,y,z=0)=>[Math.round((104+14.2*x+7.35*y)*10)/10,Math.round((350+4.45*x-6.35*y-12.85*z)*10)/10];
 const line=(points,colour,w=1,dash='')=>'<polyline points="'+points.map(a=>P(...a).join(',')).join(' ')+'" fill="none" stroke="'+colour+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>';
 const face=(points,colour,edge='none',w=1)=>'<polygon points="'+points.map(a=>P(...a).join(',')).join(' ')+'" fill="'+colour+'" stroke="'+edge+'" stroke-width="'+w+'" stroke-linejoin="round"/>';
 const plane=(x,y,w,d,colour,z=0,edge='none')=>face([[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z]],colour,edge,.85);
 function box(x,y,w,d,h,c,z=0){
  c=colours[c]||c;
  return face([[x,y,z],[x+w,y,z],[x+w,y,z+h],[x,y,z+h]],c[1],'#2b32302b',.6)
   +face([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]],c[2],'#2b32302b',.6)
   +plane(x,y,w,d,c[0],z+h,'#2b32302b');
 }
 const dot=(x,y,z,r,fill)=>{const [a,b]=P(x,y,z);return '<circle cx="'+a+'" cy="'+b+'" r="'+r+'" fill="'+fill+'"/>';};
 const shadow=(x,y,rx,ry)=>{const [a,b]=P(x,y);return '<ellipse cx="'+a+'" cy="'+b+'" rx="'+rx+'" ry="'+ry+'" fill="#353f35" opacity=".16"/>';};
 function pallet(x,y,z,variant){
  return box(x,y,1.045,1.20,.13,'wood',z)+
    box(x+.045,y+.04,.96,1.12,1.04,'goods'+variant,z+.13)+
    line([[x+.28,y+.04,z+.15],[x+.28,y+.04,z+1.17],[x+.28,y+1.154,z+1.17]],'#eadebf',.78)+
    line([[x+.81,y+.04,z+.15],[x+.81,y+.04,z+1.17],[x+.81,y+1.154,z+1.17]],'#eadebf',.78);
 }
 function bay(x,y,i,m,rackFire) {
  let art='<g class="d21-rack-bay" data-levels="4" data-pallets-per-level="2">';
  for(const xx of [x,x+2.73]) {
   art+=line([[xx,y+1.30,0],[xx,y+1.30,7.05]],'#365569',2.7);
   for(const z of [.4,2.2,4.0,5.8])art+=line([[xx,y+.04,z],[xx,y+1.30,z+1.2]],'#6d8590',1.1);
  }
  for(let tier=3;tier>=0;tier--){
   const z=[.025,1.82,3.64,5.46][tier];
   if(tier>0)art+=box(x,y+1.19,2.73,.10,.13,'beam',z-.12);
   if(rackFire&&(tier===2||tier===3)){
    art+='<g class="d20-rack-pipework">';
    art+=line([[x,y+1.30,z+1.42],[x+2.73,y+1.30,z+1.42]],'#a74537',1.4)+dot(x+1.35,y+1.27,z+1.30,1.35,'#e5a047')+'</g>';
   }
   for(let j=0;j<2;j++)if(m.loaded.has(i*8+tier*2+j)){
    const xx=x+.21+j*1.13;art+='<g class="d21-pallet">'+pallet(xx,y+.04,z,(i+tier+j)%3+1)+'</g>';
   }
   if(tier>0)art+=box(x,y-.045,2.73,.12,.14,'beam',z-.13);
  }
  for(const xx of [x,x+2.73]){
   art+=line([[xx,y,0],[xx,y,7.05]],'#35576c',3.1)+line([[xx,y,7.05],[xx,y+1.3,7.05]],'#6e8791',1.6);
   art+=box(xx-.075,y-.075,.15,.17,.17,'beam');
  }
  return art+'</g>';
 }
 function walker(x,y,i){
  const [a,b]=P(x,y), delta=P(x,y+(i%2?3.2:-3.2)).map((c,k)=>c-[a,b][k]);
  return '<g transform="translate('+a+' '+b+')"><g class="d21-worker d21-shuttle" style="--dx:'+delta[0]+'px;--dy:'+delta[1]+'px;--period:'+(5.6+i*.8)+'s;--delay:-'+(i*.73)+'s"><ellipse cx="0" cy="1" rx="4.6" ry="1.8" fill="#343a30" opacity=".26"/><path class="d21-stride" d="M-2 -7l-1 5-2 2M2 -7l2 4 2 2" stroke="#33424a" stroke-width="2.3" stroke-linecap="round" fill="none"/><path d="M-3 -15l-3 5m9-5 3 4" stroke="#526b75" stroke-width="1.9" stroke-linecap="round"/><path d="M-3 -16h6l1 8h-8z" fill="#e4a13b" stroke="#80562e" stroke-width=".65"/><path d="M-3.7 -11h7.4" stroke="#f7e7ad" stroke-width="1.4"/><circle cy="-18.5" r="2.25" fill="#b9845d"/><path d="M-3 -19.3a3 2.8 0 0 1 6 0z" fill="#edbc57"/></g></g>';
 }
 function forklift(x,y,active,i){
  const [a,b]=P(x,y),delta=P(x-3.7,y).map((c,k)=>c-[a,b][k]);
  return '<g transform="translate('+a+' '+b+')"><g class="d21-forklift'+(active?' d21-shuttle':'')+'" style="--dx:'+delta[0]+'px;--dy:'+delta[1]+'px;--period:'+(7+i*.8)+'s;--delay:-'+(i*1.2)+'s"><ellipse cx="1" cy="2" rx="16" ry="5" fill="#34392f" opacity=".2"/><path d="M-13 -5l18 5 12-7-18-5z" fill="#e6ad4f"/><path d="M-13 -5l18 5v5l-18-5zm18 5 12-7v5l-12 7z" fill="#c78930"/><circle cx="-8" cy="2" r="3.6" fill="#333d3b"/><circle cx="4" cy="5" r="4.2" fill="#333d3b"/><circle cx="13" cy="-1" r="3.4" fill="#333d3b"/><path d="M-11 -5v-16l15 4v16m0-16 9-5v16m-24-15 9-5 15 4" fill="none" stroke="#36464a" stroke-width="2"/>'+(active?'<path d="M-3 -8v-6l5 1v6z" fill="#e4a13b"/><circle cx="-1" cy="-16" r="2" fill="#eec761"/>':'')+'<path d="M14 -2v-17m4 15v-17m-4 17 11 3m-7-5 11 3" fill="none" stroke="#4d5756" stroke-width="2" stroke-linecap="round"/></g></g>';
 }
 const dockLocations=n=>Array.from({length:Math.min(6,Math.max(0,count(n)))},(_,i)=>3+i*5.1);
 function yard(v,m) {
  const docks=dockLocations(v.dockDoors),clad='#d3d3c8',edge='#778381', steel='#586c71';
  let art='<rect width="910" height="545" fill="#ebe4d4"/>'+plane(-1,26,39,5.0,'#929388')+plane(33,14,8,13,'#a3a396');
  if(v.sections>1)for(let i=0;i<Math.min(2,count(v.sections)-1);i++){
   const x=19+i*7.0;
   art+='<g class="d21-built-extension">'+box(x,26.1,6.65,4.9,3.64,'clad')+
    box(x-.08,25.98,6.83,5.13,.13,'steel',3.64)+line([[x+.35,30.96,2.35],[x+6.28,30.96,2.35]],'#8caba4',2.3)+'</g>';
  }
  art+=box(0,0,33,26,0.62,'slab',-.62)+plane(0,0,33,26,'#c6c5b9',.008,'#9b9b8f');
  for(let x=4;x<33;x+=4.5)art+=line([[x,0,.02],[x,26,.02]],'#969b90',.65);
  for(let y=4;y<26;y+=4.5)art+=line([[0,y,.02],[33,y,.02]],'#969b90',.65);
  const rear=(x,w,h,z=0)=>face([[x,26,z],[x+w,26,z],[x+w,26,z+h],[x,26,z+h]],clad,edge);
  // Back walls are drawn before the contents, with the first real dock cut open.
  let prev=0;
  for(let i=0;i<docks.length;i++) {
   const x=docks[i];art+=rear(prev,x-prev,5.25);
   art+=face([[x,26,0],[x+3.25,26,0],[x+3.25,26,3.85],[x,26,3.85]],i===0&&v.moves?'#3d5258':'#788687',steel,1.6);
   if(i!==0||!v.moves)for(let z=.30;z<3.85;z+=.30)art+=line([[x+.12,25.97,z],[x+3.13,25.97,z]],'#a1aaa3',.72);
   else art+=box(x+.36,26.02,2.56,3.1,2.36,'clad',.66);
   art+=rear(x,3.25,1.4,3.85);
   for(const xx of [x-.22,x+3.48])art+=line([[xx,25.72,0],[xx,25.72,.86]],'#dea448',2.4);
   art+=line([[x,25.43,.03],[x,22.6,.03],[x+3.25,22.6,.03],[x+3.25,25.43,.03]],'#bf913d',1.18);
   prev=x+3.25;
  }
  art+=rear(prev,33-prev,5.25);
  art+=line([[0,26,5.25],[33,26,5.25]],steel,2.1);
  art+=face([[0,0,0],[0,26,0],[0,26,5.25],[0,0,2.26]],'#bdc2b7',edge);
  art+=line([[0,0,2.26],[0,26,5.25]],steel,2.1);
  for(const y of [4,9,14,19,23]){
   let z=1.25+y*.072;
   art+=face([[.025,y,z],[.025,y+2.7,z],[.025,y+2.7,z+.64],[.025,y,z+.64]],'#91aaa7','#647b7e',1);
   art+=line([[0,y-.31,0],[0,y-.31,2.21+y*.115]],steel,1.15);
  }
  // Painted safety separation and loading zone. Contrast increases only in flow view.
  const flow=v.mode==='flow';
  art+=plane(30.94,1.1,1.30,24,'#749078',.04)+line([[30.93,1.1,.06],[30.93,25.1,.06]],'#f3e6b9',1.3);
  for(const y of [3.4,18.6])for(let k=0;k<5;k++)art+=line([[29.1,y+k*.23,.06],[32.3,y+k*.23,.06]],'#f1e8c7',1.1);
  for(const y of [4.5,10.25,16.85,21.7])art+=line([[2,y,.03],[29.9,y,.03]],flow?'#a36f2f':'#eee5c1',flow?2.35:1.1,'9 8');
  for(const [a,b] of [[5,9],[11.9,17.7],[20.2,23.9]]){
   art+=line([[30.81,a,.70],[30.81,b,.70]],'#c48a33',2.1);
   for(const y of [a,b])art+=line([[30.81,y,0],[30.81,y,.77]],'#c48a33',2.5);
  }
  const fire=v.fireProtection||{}, div=Math.max(1,count(v.sections));
  const items=[];
  const add=(x,y,paint)=>items.push({depth:y-.28*x,paint});
  layout.slice(0,m.bays).forEach(([x,y],i)=>add(x,y,bay(x,y,i,m,i<Math.round(m.bays*proportion(count(fire.rack),div)))));
  if(m.floorMode)for(let i=0;i<m.loads;i++){
   const x=4.8+(i%6)*1.55,y=8.1+Math.floor(i/6)*1.72;
   add(x,y,'<g class="d21-pallet">'+pallet(x,y,.02,i%3+1)+'</g>');
  }
  if(v.automated) {
   const a=29,b=12.4;
   let auto=box(a,b,.98,5.23,.66,'mint');
   for(let y=b+.3;y<b+4.9;y+=.55)auto+=line([[a+.1,y,.68],[a+.90,y,.68]],'#d1ddd2',1.12);
   auto+=box(a+.1,b+1.98,.79,1.09,1.40,'steel',.72);
   add(a,b,'<g class="d21-automation">'+auto+'</g>');
  }
  for(let i=0;i<Math.min(5,count(v.staff));i++){
   const x=i===4?29.8:31.6,y=[4.9,10.2,16.1,22.5,23.7][i];
   add(x,y,walker(x,y,i));
  }
  if(!m.fleet&&v.staff>0&&v.moves>0){
   const x=7.6,y=3.2;
   add(x,y,'<g class="d21-pallet-jack">'+box(x,y,.57,.41,.17,'warm')
    +line([[x+.18,y,.08],[x+.18,y+.93,.08]],'#b66f31',2.1)
    +line([[x+.48,y,.08],[x+.48,y+.93,.08]],'#b66f31',2.1)
    +line([[x+.31,y-.02,.17],[x+.31,y-.38,.86]],'#53706a',1.65)
    +line([[x+.14,y-.38,.86],[x+.47,y-.38,.86]],'#53706a',1.65)+'</g>');
  }
  for(let i=0;i<m.fleet;i++){
   const x=[18.0,24.2,29.1][i],y=[10.7,18.8,21.4][i];
   // Vehicles are drawn in clear vehicle lanes. Parked leases never imply operating capacity.
   add(x,y,forklift(x,y,i<m.assigned&&v.moves>0,i));
  }
  art+=items.sort((a,b)=>b.depth-a.depth).map(x=>x.paint).join('');
  // Draw external plant and in-building sprinklers only on commissioning.
  if(fire.water>0){
   const [x,y]=P(37.4,21.2,.02);
   art+='<g class="d20-water-tank">'+shadow(37.4,21.2,41,13)+'<path d="M'+(x-34)+' '+(y-52)+'v47c0 18 68 18 68 0v-47Z" fill="#527b70" stroke="#3c665e" stroke-width="1.45"/><ellipse cx="'+x+'" cy="'+(y-52)+'" rx="34" ry="10" fill="#96ad9f" stroke="#3c665e" stroke-width="1.45"/><ellipse cx="'+(x+4)+'" cy="'+(y-53)+'" rx="6" ry="2.7" fill="#627d70"/>';
   for(const z of [8,19,29,40])art+='<path d="M'+(x-34)+' '+(y-z)+'q34 16 68 0" stroke="#a5b8a7" stroke-opacity=".68" fill="none"/>';
   art+='<path d="M'+(x+23)+' '+(y-47)+'v45m4-44v45m-4-6h4m-4-8h4m-4-8h4m-4-8h4m-4-8h4" stroke="#394b46" fill="none"/></g>';
   art+='<g class="d20-pump-house">'+box(36,16,2.35,1.87,1.69,'clad')+box(35.89,15.9,2.57,2.07,.14,'steel',1.69)+face([[36.72,15.99,.05],[37.53,15.99,.05],[37.53,15.99,1.36],[36.72,15.99,1.36]],'#47606a')+'</g>';
   art+=line([[37.4,19.08,.43],[37.4,17.81,.43],[33,17.81,.43]],'#a94437',2.5);
  }
  if(fire.roof>0){
   art+='<g class="d20-roof-pipework">';
   const width=Math.max(3.5,29*proportion(count(fire.roof),div));
   art+=line([[2.0,21.37,7.4],[2+width,21.37,7.4]],'#a74336',2.45);
   for(let i=0;i<Math.max(1,Math.round(4*width/29));i++){
    const x=2+width*(i+.58)/Math.max(1,Math.round(4*width/29));
    art+=line([[x,21.37,7.4],[x,8.1,7.4]],'#af5946',1.35);
    for(const y of [9.5,14.6,19.7]){
     art+=line([[x,y,7.4],[x,y,7.14]],'#a74336',1.1)+dot(x,y,7.10,1.45,'#b77e3d');
    }
   }
   art+='</g>';
  }
  const queued=(v.projects||[]).find(p=>p.type==='Expansion');
  if(queued&&v.mode==='build'){
   art+='<g class="d21-extension-works">'+plane(33.4,1.6,5.1,11.2,'#c3ac83',.045,'#b3833b')+line([[33.4,1.6,.08],[38.5,1.6,.08],[38.5,12.8,.08],[33.4,12.8,.08],[33.4,1.6,.08]],'#9c6e2d',2,'6 4');
   if(queued.remaining<=4)for(const x of [33.72,38.18])for(const y of [2,12.37])art+=line([[x,y,0],[x,y,4.3]],'#687571',2.5);
   if(queued.remaining<=2)art+=line([[33.72,2,4.3],[38.18,2,4.3],[38.18,12.37,4.3],[33.72,12.37,4.3],[33.72,2,4.3]],'#687571',2.1);
   art+='</g>';
  }
  if(v.sections>1)art+=plane(0,-.52,33,.42,'#858c81',.012);
  return art;
 }
 function render(v){
  const m=model(v), mode=Object.hasOwn(panels,v.mode)?v.mode:'floor';
  const percent=n=>Math.round(n*100)+'%';
  const p=(v.projects||[]).filter(j=>count(j.remaining)>0);
  const fire=v.fireProtection||{};
  const status=[fire.water?'Tank and pumps: commissioned':fire.waterWorks?'Tank and pumps: fit-out':null,fire.roof?'Roof sprinklers: commissioned':fire.roofWorks?'Roof sprinklers: fit-out':null,fire.rack?'In-rack sprinklers: commissioned':fire.rackWorks?'In-rack sprinklers: fit-out':null].filter(Boolean);
  const links=[['d15-investment','Storage'],['d15-operations','Handling'],['d15-staff','Site team'],['d15-projects','Projects']];
  const idx=Number.isInteger(v.siteIndex)&&v.siteIndex>=0?v.siteIndex:null;
  const stock='<div class="d21-yard-metrics"><div><b>Racking fit-out</b><strong>'+percent(m.fit)+'</strong><small>'+num(v.racks)+' of '+num(Math.max(1,count(v.sections))*9)+' rack blocks</small></div><div role="meter" aria-label="Storage occupied" aria-valuenow="'+Math.round(m.fill*100)+'" aria-valuemin="0" aria-valuemax="100"><b>Storage occupied</b><strong>'+percent(m.fill)+'</strong><small>'+num(v.occupied)+' of '+num(v.spaces)+' pallet spaces</small></div></div>';
  const flow='<div class="d21-yard-metrics"><div><b>Signed handling</b><strong>'+num(v.moves)+'</strong><small>Moves this turn</small></div><div><b>Handling capacity</b><strong>'+num(v.capacity)+'</strong><small>'+(v.moves>v.capacity?num(v.moves-v.capacity)+' moves above capacity':num(v.capacity-v.moves)+' spare moves')+'</small></div></div>';
  const build='<div class="d21-yard-projects">'+(p.length?'<ul>'+p.map(j=>'<li><b>'+esc(names[j.type]||'Site work')+'</b><span>'+num(j.remaining)+' '+(j.remaining===1?'turn':'turns')+' left</span></li>').join('')+'</ul>':'<p>No investment work is queued.</p>')+'</div>';
  return '<figure class="d21-yard-view'+(v.motion===false?' d21-paused':'')+'" data-fit="'+percent(m.fit)+'" data-occupancy="'+percent(m.fill)+'"><div class="d21-yard-head"><b>Warehouse cutaway</b><button type="button" data-scene-zoom="'+(idx??0)+'">Enlarge</button></div><svg class="d21-yard-svg" viewBox="70 105 832 415" role="img" aria-label="Warehouse cutaway: '+percent(m.fit)+' rack fit-out, '+percent(m.fill)+' active storage, '+num(v.staff)+' staff, '+num(v.sections)+' sections">'+yard({...v,mode},m)+'</svg><figcaption><div class="d21-yard-controls" aria-label="Warehouse view">'+Object.entries(panels).map(([k,label])=>'<button class="d13-mode" data-scene-mode="'+k+'" aria-pressed="'+(k===mode)+'">'+label+'</button>').join('')+'<button type="button" data-scene-motion aria-label="'+(v.motion===false?'Resume motion':'Pause motion')+'">'+'<svg viewBox="0 0 18 18" width="15" height="15" aria-hidden="true" fill="currentColor">'+(v.motion===false?'<path d="M5 3l10 6-10 6z"/>':'<path d="M5 3h3v12H5zm5 0h3v12h-3z"/>')+'</svg>'+'</button></div>'+(mode==='floor'?stock:mode==='flow'?flow:build)+(status.length?'<p class="d21-yard-fire">'+status.map(esc).join(' · ')+'</p>':'')+'<div class="d21-yard-links">'+links.map(([id,label])=>'<a href="#'+id+'"'+(idx===null?'':' data-d15-open-site="'+idx+'"')+'>'+label+' <span aria-hidden="true">›</span></a>').join('')+'</div></figcaption></figure>';
 }
 return {render,model};
})();
