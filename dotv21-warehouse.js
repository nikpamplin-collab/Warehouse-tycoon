/* Label-free site drawing. Coordinates and counts are display-only, never game inputs. */
const DOT21Yard=(()=>{
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const num=n=>Math.round(n).toLocaleString('en-GB');
 const count=n=>Number.isFinite(n)?Math.max(0,Math.floor(n)):0;
 const cap=(n,a,b)=>Math.max(a,Math.min(b,n));
 const panels={floor:'Warehouse',flow:'Pallet moves',build:'Work in progress'};
 const names={'Racking':'Racking','Expansion':'Expansion','Automation':'Automation','Replacement':'Automation replacement','CI':'Productivity improvement project','Dock door':'Dock door','Tank and pumps':'Tank and pumps','Roof sprinklers':'Roof sprinklers','In-rack sprinklers':'In-rack sprinklers','Sprinklers':'Legacy sprinklers'};
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
  const positions=bays*8||24, loads=Math.round(fill*positions);
  const order=Array.from({length:positions},(_,i)=>i).sort((a,b)=>{
   const priority=i=>!bays?i:(i%8)*93+(i%8)*11+((i>>3)*7)%12;
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
 function dockPlan(n) {
  const total=count(n), pitch=Math.min(5.1,29/Math.max(1,total)), width=Math.min(3.25,pitch*.72);
  return Array.from({length:total},(_,i)=>({x:(total<=6?3:1.4)+i*pitch,width}));
 }
 function articulatedTruck(heading) {
  // Model a UK box lorry in plan, then project the cargo body and cab into the world.
  const [dx,dy]=heading, pt=(l,w,z=0)=>[dx*l-dy*w,dy*l+dx*w,z];
  const f=(pts,c,e='#344748')=>face(pts.map(a=>pt(...a)),c,e,.85);
  const pad=(a,b,c,d)=>[[a,c],[b,c],[b,d],[a,d]];
  function body(a,b,w,lo,hi,palette){
   return f([[a,-w,lo],[b,-w,lo],[b,-w,hi],[a,-w,hi]],palette[1])+
    f([[b,w,lo],[a,w,lo],[a,w,hi],[b,w,hi]],palette[2])+
    f([[a,w,lo],[a,-w,lo],[a,-w,hi],[a,w,hi]],palette[2])+
    f([[b,-w,lo],[b,w,lo],[b,w,hi],[b,-w,hi]],palette[1])+
    f(pad(a,b,-w,w).map(v=>[...v,hi]),palette[0]);
  }
  const [ox,oy]=P(0,0);
  let a='<g transform="translate('+(-ox)+' '+(-oy)+')">';
  a+=f(pad(-3.35,3.5,-1.12,1.12),'#454d4430','none');
  for(const l of [-2.3,-1.54,1.0,2.65])for(const w of [-.88,.88])a+=dot(...pt(l,w,.36),4,'#293330')+dot(...pt(l,w,.36),1.6,'#9a9e92');
  const trailer=body(-3.35,1.04,.93,.67,2.73,['#ebebe0','#b7c5bd','#92a6a2']);
  const cab=body(1.22,3.28,.84,.58,2.16,['#6d9e93','#507c75','#3c655f'])+
   f([[3.29,-.65,1.34],[3.29,.65,1.34],[3.29,.65,1.99],[3.29,-.65,1.99]],'#263e49')+
   f([[2.25,-.85,1.36],[3.12,-.85,1.36],[3.12,-.85,1.99],[2.25,-.85,1.99]],'#49717d')+
   f([[2.25,.85,1.36],[3.12,.85,1.36],[3.12,.85,1.99],[2.25,.85,1.99]],'#49717d')+
   dot(...pt(3.305,-.62,.95),1.4,'#fff0c4')+dot(...pt(3.305,.62,.95),1.4,'#fff0c4');
  const [,ty]=P(...pt(-1.5,0,0)),[,cy]=P(...pt(2.4,0,0));
  return a+(ty<cy?trailer+cab:cab+trailer)+'</g>';
 }
 function yardDelivery(dock,moves) {
  if(!dock||!(moves>0))return {exterior:'',interior:''};
  const x=dock.x+dock.width/2, y=29.39;
  const coords=[[-33,44],[37.4,44],[35.2,37.3],[x+3,35.25],[x,35.25],[x,y],
    [x,35.25],[34,36.5],[37.4,44],[71,44]];
  const variables=coords.map((p,i)=>'--p'+i+':'+P(...p).map(n=>n+'px').join(',')).join(';');
  const types=[['east',[1,0]],['in',[0,-1]],['west',[-1,0]],['out',[0,1]]];
  const moving='<g class="d21-yard-lorry" style="'+variables+'">'+types.map(([k,d])=>
    '<g class="d21-lorry-direction d21-lorry-'+k+'">'+articulatedTruck(d)+'</g>').join('')+'</g>';
  const staticArt='<g class="d21-parked-lorry" transform="translate('+P(x,y).join(' ')+')">'+articulatedTruck([0,1])+'</g>';
  const [a,b]=P(x,25.25,.10),[c,d]=P(x,21,.10);
  return {
   exterior:'<g class="d21-delivery" aria-hidden="true">'+moving+staticArt+'</g>',
   interior:'<g aria-hidden="true" transform="translate('+a+' '+b+')"><g class="d21-unload-pallet" style="--ux:'+(c-a)+'px;--uy:'+(d-b)+'px">'+
    '<g transform="translate(-104 -350)">'+pallet(-.49,-.40,.02,2)+'</g></g></g>'
  };
 }
 function tree(x,y,n) {
  const [a,b]=P(x,y), h=27+(n%4)*5, r=8+(n%3)*2;
  const palette=[['#526d4d','#789467','#8aa574'],['#617a50','#819c64','#a6ae78'],['#58765d','#77957a','#9aac77']][n%3];
  return '<g class="d21-perimeter-tree" transform="translate('+a+' '+b+')">'+
   '<ellipse cx="6" cy="1" rx="'+(r+6)+'" ry="4" fill="#52644b" opacity=".27"/>'+
   '<path d="M0 0v-'+(h*.68)+'m0 8-5-7m5 3 5-10" fill="none" stroke="#665e42" stroke-width="2.7" stroke-linecap="round"/>'+
   '<path d="M-'+(r+3)+' -'+(h*.52)+'Q-'+(r+5)+' -'+(h*.82)+' -6 -'+(h*.88)+'Q0 -'+(h+4)+' 6 -'+(h*.92)+'Q'+(r+6)+' -'+(h*.90)+' '+(r+3)+' -'+(h*.58)+'Q'+(r+5)+' -'+(h*.39)+' 3 -'+(h*.40)+'Q-4 -'+(h*.31)+' -'+(r+3)+' -'+(h*.52)+'Z" fill="'+palette[0]+'"/>'+
   '<ellipse cx="-3" cy="-'+(h*.74)+'" rx="'+r+'" ry="'+(h*.23)+'" fill="'+palette[1]+'"/>'+
   '<path d="M-'+r+' -'+(h*.77)+'Q-4 -'+(h*.99)+' 4 -'+(h*.89)+'Q0 -'+(h*.72)+' -'+r+' -'+(h*.77)+'Z" fill="'+palette[2]+'"/></g>';
 }
 function hedgerow(start,end,y){
  let art='';
  for(let x=start;x<end;x+=1.05){
   const [a,b]=P(x,y,.25), i=Math.round(x*6);
   art+='<ellipse cx="'+a+'" cy="'+b+'" rx="'+(9+(i%4))+'" ry="'+(4+(i%3))+'" fill="'+(['#627d55','#738c5d','#566f49'][Math.abs(i)%3])+'"/>';
  }
  return art;
 }
 function grounds(docks,hit){
  // Road meets the estate entrance; the estate entry meets the dock apron along its entire edge.
  let art='<g class="d21-landscape"><rect x="-60" y="-100" width="1250" height="790" fill="#dae0c6"/>'+
   plane(-8,-7,55,51,'#b9c895')+plane(-7,-6,14,26,'#adbf88')+plane(-6,12,25,15,'#a9bd85')+
   plane(11,-5,31,4,'#b3c28d')+plane(35,1,11,21,'#afbf8a')+plane(-7,39,55,5,'#b9c995')+
   face([[-7,25,0],[3,29,0],[4,38,0],[-6,41,0]],'#98ae78')+
   face([[32,-5,0],[42,-3,0],[44,11,0],[38,14,0]],'#9fb67b');
  art+='<g class="d21-public-road">'+hit('handling','Public road and lorry traffic',plane(-10,41.8,55,7.25,'#68716a',.001)+
   line([[-10,42.1,.014],[45.1,42.1,.014]],'#e0dfcb',1.35)+line([[-10,48.77,.014],[45.1,48.77,.014]],'#e0dfcb',1.35)+
   line([[-10,45.42,.02],[45,45.42,.02]],'#eae6cc',1.6,'11 8'))+'</g>';
  art+='<g class="d21-loading-yard">'+hit('docks','Loading yard',plane(-.6,26,37.8,13.25,'#92958a',.03,'#7d8779')+
   plane(33,14,8,13,'#9ca095',.02,'#7d8779')+
   face([[26.7,38.65,.045],[37.16,38.65,.045],[40,42.2,.045],[35.05,42.2,.045],[32.15,39.2,.045],[26.7,39.2,.045]],'#888e83')+
   line([[.06,38.7,.05],[28.2,38.7,.05],[32.2,39.0,.05],[35.0,42.1,.05]],'#d5d8bd',1.5)+
   line([[36.98,36.7,.05],[37.2,38.7,.05],[39.92,42.14,.05]],'#d5d8bd',1.55)+
   line([[34.3,38.8,.05],[37.6,42.0,.05]],'#e9e4cf',1.55,'6 5')+
   line([[35.55,42.24,.057],[39.4,42.24,.057]],'#ece8d7',1.0,'3 3'));
  for(const {x,width} of docks)for(const side of [x,x+width])art+=line([[side,28.75,.045],[side,35.45,.045]],'#d7d8c1',.8,'4 4');
  art+=line([[2.2,36.85,.045],[28.8,36.85,.045]],'#d6dcbe',1.0,'10 8')+'</g>';
  art+=hedgerow(-3,24,40.5)+hedgerow(39.7,44.5,39.65);
  const trees=[[-4.4,14.8],[-4.2,18.6],[-3.5,24],[-3.0,32.3],[-2.7,38.6],[1.2,40.1],[8.6,39.9],[16.4,40.1],[23.7,40.1],[41.2,35.3],[43.1,31.2],[42.5,25.1],[41.65,10.8],[37,4.1],[35.9,-1.6]];
  art+=trees.map(([x,y],i)=>tree(x,y,i)).join('');
  for(const [x,y] of [[2.2,-3.3],[3.55,-3.3],[5.45,-3.1],[6.8,-3.2],[8,-3.3],[12.0,-3.1],[13.2,-3.4],[16.6,-3.05],[20,-3.22],[21.5,-3.3],[24.5,-3.2],[28.4,-3.1],[29.7,-3.5]]){
   const [a,b]=P(x,y,.22);
   art+='<ellipse cx="'+a+'" cy="'+b+'" rx="10" ry="4" fill="#92aa77"/><ellipse cx="'+(a-1.5)+'" cy="'+(b-1.6)+'" rx="6" ry="3" fill="#809d69"/>';
  }
  return art+'</g>';
 }
 const officeRoles=v=>[
  {key:'safety',label:'H&S',filled:!!v.safetyManager,colour:'#d99545',icon:'M-4-2L0-5l4 3v3L0 5l-4-4z M-2 0l1.5 2L2-1'},
  {key:'stock',label:'Stock control',filled:!!v.stockManager,colour:'#6b9e94',icon:'M-4-3h8v7h-8z M-4-1h8 M-1-3v2'},
  {key:'operations',label:'Ops management',filled:count(v.opsManagers)>0,colour:'#88a7ce',icon:'M-4 4v-3m4 3v-5m4 5v-8'}
 ];
 function office(v,hit){
  const x=16.5,y=.65,w=13.25,d=4.15,frame='#596f71';
  let art='<g class="d21-cutaway-office">'+
   box(x,y,w,d,.11,'clad',.02)+plane(x+.10,y+.10,w-.20,d-.20,'#d5c5ab',.14,'#825f46')+
   line([[x,y+d,.17],[x+w,y+d,.17]],frame,2.1);
  // Rear glass and low cut front walls suggest an office without hiding the desks or team.
  for(let n=0;n<3;n++){
   const a=x+n*w/3,b=x+(n+1)*w/3;
   art+=face([[a,y+d,.18],[b,y+d,.18],[b,y+d,2.65],[a,y+d,2.65]],'#a0bdb62a',frame,.9);
   art+=line([[a,y+d,1.0],[b,y+d,1.0]],'#688782',.8);
  }
  art+=face([[x,y,.14],[x,y+d,.14],[x,y+d,2.65],[x,y,1.23]],'#a0bdb629',frame,1.1);
  const roles=officeRoles(v);
  art+=hit('management','Site management office',plane(x,y,w,d,'transparent',.16));
  roles.forEach((r,k)=>{
   const xx=17.1+k*4.23;
   const [a,b]=P(xx+.31,3.56,.12),[mx,my]=P(xx+1.62,2.40,1.86);
   const station='<g class="d21-office-station" data-office-role="'+r.key+'" data-staffed="'+r.filled+'"><title>'+esc(r.label)+(r.filled?' appointed':' not appointed')+'</title>'+
    box(xx+.16,3.20,.72,.67,.45,'steel',.18)+
    (r.filled?'<g class="d21-office-person" transform="translate('+a+' '+b+')"><ellipse cx="0" cy="1" rx="5" ry="2" fill="#655744" opacity=".24"/><path d="M-3-9v8m5-8v8" stroke="#3a4953" stroke-width="2.6" stroke-linecap="round"/><path d="M-4-18q4-3 8 0l1 9h-10z" fill="'+r.colour+'" stroke="#435353" stroke-width=".65"/><path d="M4-16l3 4 3-1" fill="none" stroke="#655844" stroke-width="1.6" stroke-linecap="round"/><circle cy="-21" r="3.35" fill="'+['#b7805a','#8e6048','#d29b73'][k]+'"/><path d="M-3-21a3 3 0 0 1 6-1" stroke="#4a4139" stroke-width="1.4" fill="none"/><g class="d21-office-badge" transform="translate(0 -37)"><title>'+esc(r.label)+'</title><circle r="10" fill="#29423b" stroke="#f6efdb" stroke-width="1.3"/><path d="'+r.icon+'" transform="scale(1.45)" fill="none" stroke="'+r.colour+'" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></g></g>':'')+
    box(xx+.76,1.65,2.72,1.04,.91,['#dfbb91','#ad815a','#96694a'],.14)+
    box(xx+1.29,2.22,1.02,.26,.12,'steel',1.05)+
    '<g transform="translate('+mx+' '+my+')"><rect x="-8" y="-6" width="16" height="12" rx="1.5" fill="#374b53" stroke="#26363d" stroke-width=".7"/><path d="'+r.icon+'" stroke="'+(r.filled?r.colour:'#88938e')+'" stroke-width="1.1" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>'+
    plane(xx+2.45,2.0,.55,.43,'#ece1c6',1.06,'#b1a183')+'</g>';
   art+=hit(r.key,r.label,plane(xx-.25,1.2,3.95,3.38,'transparent',.19)+station);
  });
  art+=face([[x,y,.13],[x+w,y,.13],[x+w,y,.62],[x,y,.62]],'#7a9190',frame,.9);
  art+=face([[x+w,y,.13],[x+w,y+d,.13],[x+w,y+d,1.06],[x+w,y,.62]],'#9eb5af88',frame,.85);
  return art+'</g>';
 }
 function yard(v,m) {
  const docks=dockPlan(v.dockDoors),clad='#d3d3c8',edge='#778381', steel='#586c71';
  const unique=new Set(), idx=Number.isInteger(v.siteIndex)&&v.siteIndex>=0?v.siteIndex:0;
  const hit=(key,label,shape)=>{
   const first=!unique.has(key);unique.add(key);
   return '<g class="d21-scene-hit" role="button" tabindex="'+(first?'0':'-1')+'" data-scene-hit="'+key+'" data-scene-site="'+idx+'" aria-label="'+esc(label)+'"><title>'+esc(label)+'</title>'+shape+'</g>';
  };
  let art=grounds(docks,hit);
  const delivery=yardDelivery(docks[0],v.moves);
  if(delivery.exterior)art+=hit('handling','Lorry traffic',delivery.exterior);
  if(v.sections>1)for(let i=0;i<Math.min(2,count(v.sections)-1);i++){
   const x=19+i*7.0;
   art+=hit('expansion','Warehouse extension','<g class="d21-built-extension">'+box(x,26.1,6.65,4.9,3.64,'clad')+
    box(x-.08,25.98,6.83,5.13,.13,'steel',3.64)+line([[x+.35,30.96,2.35],[x+6.28,30.96,2.35]],'#8caba4',2.3)+'</g>');
  }
  art+=box(0,0,33,26,0.62,'slab',-.62)+plane(0,0,33,26,'#c6c5b9',.008,'#9b9b8f');
  for(let x=4;x<33;x+=4.5)art+=line([[x,0,.02],[x,26,.02]],'#969b90',.65);
  for(let y=4;y<26;y+=4.5)art+=line([[0,y,.02],[33,y,.02]],'#969b90',.65);
  art+=hit('storage','Warehouse floor and racking',plane(.25,.22,32.4,24.9,'transparent',.027));
  const rear=(x,w,h,z=0)=>face([[x,26,z],[x+w,26,z],[x+w,26,z+h],[x,26,z+h]],clad,edge);
  // Back walls are drawn before the contents, with the first real dock cut open.
  let prev=0;
  for(let i=0;i<docks.length;i++) {
   const {x,width:w}=docks[i], open=i===0&&v.moves>0;
   art+=rear(prev,x-prev,5.25);
   let door='<g class="d21-dock-door" data-dock="'+(i+1)+'">';
   door+=face([[x,26,0],[x+w,26,0],[x+w,26,3.85],[x,26,3.85]],open?'#5577762b':'#788687',steel,1.6);
   if(!open)for(let z=.30;z<3.85;z+=.30)art+=line([[x+.12,25.97,z],[x+w-.12,25.97,z]],'#a1aaa3',.72);
   door+=open?line([[x,26,3.85],[x,26,5.25],[x+w,26,5.25],[x+w,26,3.85]],steel,1.35):rear(x,w,1.4,3.85);
   const kerb=Math.min(.22,w*.09);
   for(const xx of [x-kerb,x+w+kerb])art+=line([[xx,25.72,0],[xx,25.72,.86]],'#dea448',2.1);
   door+=line([[x,25.43,.03],[x,22.6,.03],[x+w,22.6,.03],[x+w,25.43,.03]],'#bf913d',1.12)+'</g>';
   art+=hit('docks','Dock door '+(i+1),door);
   prev=x+w;
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
  // Keep solid markings for the dock and pedestrian route, not striped lines across the slab.
  art+=plane(30.94,1.1,1.30,24,'#749078',.04)+line([[30.93,1.1,.06],[30.93,25.1,.06]],'#f3e6b9',1.3);
  for(const y of [3.4,18.6])for(let k=0;k<5;k++)art+=line([[29.1,y+k*.23,.06],[32.3,y+k*.23,.06]],'#f1e8c7',1.1);
  for(const [a,b] of [[5,9],[11.9,17.7],[20.2,23.9]]){
   art+=line([[30.81,a,.70],[30.81,b,.70]],'#c48a33',2.1);
   for(const y of [a,b])art+=line([[30.81,y,0],[30.81,y,.77]],'#c48a33',2.5);
  }
  const fire=v.fireProtection||{}, div=Math.max(1,count(v.sections));
  const items=[];
  const add=(x,y,paint)=>items.push({depth:y-.28*x,paint});
  layout.slice(0,m.bays).forEach(([x,y],i)=>add(x,y,hit('storage','Pallet racking',bay(x,y,i,m,i<Math.round(m.bays*proportion(count(fire.rack),div))))));
  // Unracked storage uses representative, two-high block stacks on the slab.
  if(m.floorMode&&m.loads){
   for(let i=0;i<12;i++){
    const x=4.3+(i%4)*1.27,y=8.45+Math.floor(i/4)*1.42;
    const layers=Number(i<m.loads)+Number(i+12<m.loads);
    if(!layers)continue;
    let load='';
    for(let tier=0;tier<layers;tier++)load+='<g class="d21-pallet">'+pallet(x,y,.02+1.18*tier,(i+tier)%3+1)+'</g>';
    add(x,y,hit('stock-levels','Bulk pallet stacks','<g class="d21-bulk-stack" data-tiers="'+layers+'">'+load+'</g>'));
   }
  }
  if(v.automated) {
   const a=29,b=12.4;
   let auto=box(a,b,.98,5.23,.66,'mint');
   for(let y=b+.3;y<b+4.9;y+=.55)auto+=line([[a+.1,y,.68],[a+.90,y,.68]],'#d1ddd2',1.12);
   auto+=box(a+.1,b+1.98,.79,1.09,1.40,'steel',.72);
   add(a,b,hit('automation','Automation lane','<g class="d21-automation">'+auto+'</g>'));
  }
  for(let i=0;i<Math.min(5,count(v.staff));i++){
   const x=i===4?29.8:31.6,y=[4.9,10.2,16.1,22.5,23.7][i];
   add(x,y,hit('handling','Warehouse staff',walker(x,y,i)));
  }
  if(!m.fleet&&v.staff>0&&v.moves>0){
   const x=7.6,y=3.2;
   add(x,y,hit('handling','Pallet truck and handling','<g class="d21-pallet-jack">'+box(x,y,.57,.41,.17,'warm')
    +line([[x+.18,y,.08],[x+.18,y+.93,.08]],'#b66f31',2.1)
    +line([[x+.48,y,.08],[x+.48,y+.93,.08]],'#b66f31',2.1)
    +line([[x+.31,y-.02,.17],[x+.31,y-.38,.86]],'#53706a',1.65)
    +line([[x+.14,y-.38,.86],[x+.47,y-.38,.86]],'#53706a',1.65)+'</g>'));
  }
  for(let i=0;i<m.fleet;i++){
   const x=[18.0,24.2,29.1][i],y=[10.7,18.8,21.4][i];
   // Vehicles are drawn in clear vehicle lanes. Parked leases never imply operating capacity.
   add(x,y,hit('mhe','Forklift and leased equipment',forklift(x,y,i<m.assigned&&v.moves>0,i)));
  }
  art+=items.sort((a,b)=>b.depth-a.depth).map(x=>x.paint).join('');
  const protectedBays=Math.round(m.bays*proportion(count(fire.rack),div));
  if(protectedBays){
   const rackTargets=layout.slice(0,protectedBays).map(([x,y])=>line([[x,y+1.30,6.88],[x+2.73,y+1.30,6.88]],'transparent',13)).join('');
   art+=hit('rack-fire','In-rack sprinkler system',rackTargets);
  }
  if(delivery.interior)art+=hit('handling','Unloading and handling',delivery.interior);
  art+=office(v,hit);
  // Draw external plant and in-building sprinklers only on commissioning.
  if(fire.water>0){
   const [x,y]=P(37.4,21.2,.02);
   let plant='<g class="d20-water-tank">'+shadow(37.4,21.2,41,13)+'<path d="M'+(x-34)+' '+(y-52)+'v47c0 18 68 18 68 0v-47Z" fill="#527b70" stroke="#3c665e" stroke-width="1.45"/><ellipse cx="'+x+'" cy="'+(y-52)+'" rx="34" ry="10" fill="#96ad9f" stroke="#3c665e" stroke-width="1.45"/><ellipse cx="'+(x+4)+'" cy="'+(y-53)+'" rx="6" ry="2.7" fill="#627d70"/>';
   for(const z of [8,19,29,40])art+='<path d="M'+(x-34)+' '+(y-z)+'q34 16 68 0" stroke="#a5b8a7" stroke-opacity=".68" fill="none"/>';
   plant+='<path d="M'+(x+23)+' '+(y-47)+'v45m4-44v45m-4-6h4m-4-8h4m-4-8h4m-4-8h4m-4-8h4" stroke="#394b46" fill="none"/></g>';
   plant+='<g class="d20-pump-house">'+box(36,16,2.35,1.87,1.69,'clad')+box(35.89,15.9,2.57,2.07,.14,'steel',1.69)+face([[36.72,15.99,.05],[37.53,15.99,.05],[37.53,15.99,1.36],[36.72,15.99,1.36]],'#47606a')+'</g>';
   plant+=line([[37.4,19.08,.43],[37.4,17.81,.43],[33,17.81,.43]],'#a94437',2.5);
   art+=hit('tank','Sprinkler tank and pump house',plant);
  }
  if(fire.roof>0){
   let pipes='<g class="d20-roof-pipework">';
   const width=Math.max(3.5,29*proportion(count(fire.roof),div));
   pipes+=line([[2.0,21.37,7.4],[2+width,21.37,7.4]],'#a74336',2.45);
   for(let i=0;i<Math.max(1,Math.round(4*width/29));i++){
    const x=2+width*(i+.58)/Math.max(1,Math.round(4*width/29));
    pipes+=line([[x,21.37,7.4],[x,8.1,7.4]],'#af5946',1.35);
    for(const y of [9.5,14.6,19.7]){
     pipes+=line([[x,y,7.4],[x,y,7.14]],'#a74336',1.1)+dot(x,y,7.10,1.45,'#b77e3d');
    }
   }
   pipes+='</g>';
   art+=hit('roof','Roof sprinkler system',pipes+'<g stroke="transparent" stroke-width="14"><polyline class="d21-scene-pipe-hit" points="'+[P(2,21.37,7.4),P(2+width,21.37,7.4)].map(a=>a.join(',')).join(' ')+'"/></g>');
  }
  const queued=(v.projects||[]).find(p=>p.type==='Expansion');
  if(queued&&v.mode==='build'){
   let works='<g class="d21-extension-works">'+plane(33.4,1.6,5.1,11.2,'#c3ac83',.045,'#b3833b')+line([[33.4,1.6,.08],[38.5,1.6,.08],[38.5,12.8,.08],[33.4,12.8,.08],[33.4,1.6,.08]],'#9c6e2d',2,'6 4');
   if(queued.remaining<=4)for(const x of [33.72,38.18])for(const y of [2,12.37])works+=line([[x,y,0],[x,y,4.3]],'#687571',2.5);
   if(queued.remaining<=2)works+=line([[33.72,2,4.3],[38.18,2,4.3],[38.18,12.37,4.3],[33.72,12.37,4.3],[33.72,2,4.3]],'#687571',2.1);
   art+=hit('projects','Expansion in progress',works+'</g>');
  }
  if(v.sections>1)art+=plane(0,-.52,33,.42,'#858c81',.012);

  const marks={dock:[26,28,3],handling:[24,19,2.5],storage:[11,12,6],idle:[32,6,1.8],works:[36,6,3]};
  for(const d of (v.diagnostics||[])){
   const coord=marks[d.type];if(!coord)continue;
   const [x,y]=P(...coord), warn=d.tone==='warn', ink=warn?'#933b30':'#23475c';
   const shape='<g class="d24-scene-mark" data-diagnostic="'+esc(d.type)+'"><circle cx="'+x+'" cy="'+y+'" r="25" fill="transparent"/><circle cx="'+x+'" cy="'+y+'" r="14" fill="'+ink+'" stroke="#fff5de" stroke-width="2"/>'+
    (warn?'<path d="M'+x+' '+(y-7)+'v9m0 4v1" stroke="white" stroke-width="3" stroke-linecap="round"/>':'<path d="M'+x+' '+(y-7)+'v1m0 4v8" stroke="white" stroke-width="3" stroke-linecap="round"/>')+'</g>';
   art+=hit(d.route,d.label,shape);
  }

  return art;
 }
 function render(v){
  const m=model(v), mode=Object.hasOwn(panels,v.mode)?v.mode:'floor';
  const percent=n=>Math.round(n*100)+'%';
  const p=(v.projects||[]).filter(j=>count(j.remaining)>0);
  const fire=v.fireProtection||{};
  const status=[fire.water?'Tank and pumps: ready to use':fire.waterWorks?'Tank and pumps: being installed':null,fire.roof?'Roof sprinklers: ready to use':fire.roofWorks?'Roof sprinklers: being installed':null,fire.rack?'In-rack sprinklers: ready to use':fire.rackWorks?'In-rack sprinklers: being installed':null].filter(Boolean);
  const links=[['storage','Storage'],['handling','Plan pallet moves'],['management','Site team'],['projects','Projects']];
  const idx=Number.isInteger(v.siteIndex)&&v.siteIndex>=0?v.siteIndex:null;
  const signals=(v.diagnostics||[]).map(d=>'<button type="button" class="d24-signal '+esc(d.tone)+'" data-scene-hit="'+esc(d.route)+'" data-scene-site="'+(idx??0)+'"><b>'+esc(d.label)+'</b><small>'+esc(d.detail)+'</small></button>').join('');
  const floorNote=m.floorMode?' · bulk floor storage':'';
  const stock='<div class="d21-yard-metrics"><div><b>Racking installed</b><strong>'+percent(m.fit)+'</strong><small>'+num(v.racks)+' of '+num(Math.max(1,count(v.sections))*9)+' racking packages</small></div><div role="meter" aria-label="Pallet spaces booked this month" aria-valuenow="'+Math.round(m.fill*100)+'" aria-valuemin="0" aria-valuemax="100"><b>Pallet spaces booked this month</b><strong>'+percent(m.fill)+'</strong><small>'+num(v.occupied)+' of '+num(v.spaces)+' pallet spaces'+floorNote+'</small></div></div>';
  const flow='<div class="d21-yard-metrics"><div><b>Forecast pallet moves</b><strong>'+num(v.moves)+'</strong><small>This month</small></div><div><b>Pallet move capacity</b><strong>'+num(v.capacity)+'</strong><small>'+(v.moves>v.capacity?num(v.moves-v.capacity)+' moves over capacity':'Capacity for '+num(v.capacity-v.moves)+' more moves')+'</small></div></div>';
  const build='<div class="d21-yard-projects">'+(p.length?'<ul>'+p.map(j=>'<li><b>'+esc(names[j.type]||'Site work')+'</b><span>'+num(j.remaining)+' '+(j.remaining===1?'month':'months')+' left</span></li>').join('')+'</ul>':'<p>No work in progress.</p>')+'</div>';
  return '<figure data-yard-site="'+(idx??0)+'" class="d21-yard-view'+(v.motion===false?' d21-paused':'')+'" data-fit="'+percent(m.fit)+'" data-occupancy="'+percent(m.fill)+'"><div class="d21-yard-head"><b>Warehouse view</b><button type="button" data-scene-zoom="'+(idx??0)+'">Enlarge</button></div><svg class="d21-yard-svg" viewBox="12 8 1049 553" role="group" data-scene-default="'+(idx??0)+'" aria-label="Warehouse view: '+percent(m.fit)+' racking installed, '+percent(m.fill)+' of pallet spaces booked this month, '+num(v.staff)+' staff, '+num(v.sections)+' sections, '+num(count(v.dockDoors))+' dock doors ready to use, loading yard and road beside landscaped grounds. Office: '+officeRoles(v).map(r=>esc(r.label)+(r.filled?' appointed':' not appointed')).join(', ')+'">'+yard({...v,mode},m)+'</svg><figcaption><small class="d21-yard-tip">Tap an object or a warehouse alert to manage it.</small>'+(signals?'<div class="d24-signals" aria-label="Warehouse alerts">'+signals+'</div>':'')+'<div class="d21-yard-controls" aria-label="Warehouse view">'+Object.entries(panels).map(([k,label])=>'<button class="d13-mode" data-scene-mode="'+k+'" aria-pressed="'+(k===mode)+'">'+label+'</button>').join('')+'<button type="button" data-scene-motion aria-label="'+(v.motion===false?'Resume motion':'Pause motion')+'">'+'<svg viewBox="0 0 18 18" width="15" height="15" aria-hidden="true" fill="currentColor">'+(v.motion===false?'<path d="M5 3l10 6-10 6z"/>':'<path d="M5 3h3v12H5zm5 0h3v12h-3z"/>')+'</svg>'+'</button></div>'+(mode==='floor'?stock:mode==='flow'?flow:build)+(status.length?'<p class="d21-yard-fire">'+status.map(esc).join(' · ')+'</p>':'')+'<div class="d21-yard-links">'+links.map(([id,label])=>'<button type="button" data-scene-hit="'+id+'" data-scene-site="'+(idx??0)+'">'+label+' <span aria-hidden="true">›</span></button>').join('')+'</div></figcaption></figure>';
 }
 return {render,model};
})();
