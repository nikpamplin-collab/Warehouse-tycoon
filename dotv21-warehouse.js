/* Label-free site drawing. Coordinates and counts are display-only, never game inputs. */
const DOT21Yard=(()=>{
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const num=n=>Math.round(n).toLocaleString('en-GB');
 const count=n=>Number.isFinite(n)?Math.max(0,Math.floor(n)):0;
 const cap=(n,a,b)=>Math.max(a,Math.min(b,n));
 const panels={floor:'Warehouse',flow:'Pallet moves',build:'Work in progress'};
 const names={'Racking':'Racking','Expansion':'Expansion','Automation':'Automation','Replacement':'Automation replacement','CI':'Continuous improvement programme','Dock door':'Dock door','Tank and pumps':'Tank and pumps','Roof sprinklers':'Roof sprinklers','In-rack sprinklers':'In-rack sprinklers','Sprinklers':'Legacy sprinklers'};
 const rackLevels=[.018,1.81,3.62,5.43];
 const colours={slab:['#bcbab0','#86847a','#6d716b'],steel:['#637581','#465b69','#354654'],blue:['#4b7189','#355369','#2c455c'],beam:['#d27a49','#ad532e','#88391c'],wood:['#c39560','#aa7748','#8d5e38'],goods1:['#dac19b','#bb986c','#a28157'],goods2:['#d0ae7b','#b08b59','#977446'],goods3:['#dec9a6','#c4a984','#a88f6b'],warm:['#f0bd55','#d18b32','#ac6429'],dark:['#4b534b','#343f38','#27362d'],clad:['#e1ddcf','#c1c1b6','#a9b0a5'],mint:['#88a997','#608471','#476b59'],tank:['#819c8f','#49786d','#335e55']};
 const layout=[
  [4,12.7],[7.2,12.7],[10.4,12.7],[4,6.4],[7.2,6.4],[10.4,6.4],
  [20.1,12.7],[23.3,12.7],[26.5,12.7],[20.1,6.4],[23.3,6.4],[26.5,6.4]
 ];
 const tileW=33,tileD=26,wallY=26;
 const camera=[-145,-55,1640,940];
 function cell(i){return [Math.floor(i/4)*2+i%2,i%4>=2?1:0];}
 function sectionOrigin(i){const [c,row]=cell(i);return [c*tileW,-row*tileD];}
 function estate(v){
  const sections=Math.max(1,count(v.sections)),cells=Array.from({length:sections},(_,i)=>cell(i));
  const queued=(v.projects||[]).find(p=>p.type==='Expansion'&&p.remaining>0);
  const lastColumn=Math.max(...cells.map(c=>c[0]));
  const frontage=(lastColumn+1)*tileW;
  const columns=Math.max(2,lastColumn+1,queued?cell(sections)[0]+1:0);
  return {sections,cells,queued,frontage,columns,width:columns*tileW};
 }
 function dockPlan(n,sections){
  const make=(center,id)=>({x:center-1.625,width:3.25,id});
  const base=[make(4.5,1),make(10,2)];
  for(let i=1;i<sections;i++){
   const [x,row]=cell(i), offset=i===2?21:row?10:4.5;
   base.push(make(x*tileW+offset,i+2));
  }
  const extra=Array.from({length:Math.max(0,count(n)-base.length)},(_,i)=>{
   const [c,row]=cell(i);
   return make(c*tileW+(row?27:15.5),base.length+i+1);
  });
  return [...base.slice(0,count(n)),...extra].sort((a,b)=>a.x-b.x);
 }
 function proportion(n,d){return d>0?cap(n/d,0,1):0;}
 function model(v){
  const rackMax=Math.max(1,count(v.sections))*9;
  const fit=proportion(count(v.racks),rackMax), fill=proportion(count(v.occupied),count(v.spaces));
  const sections=Math.max(1,count(v.sections));
  const bays=fit?cap(Math.round(layout.length*sections*fit),1,layout.length*sections):0;
  const racks=Array.from({length:bays},(_,i)=>{
   const [x,y]=sectionOrigin(Math.floor(i/layout.length)), [a,b]=layout[i%layout.length];
   return [x+a,y+b];
  });
  const positions=bays*8||24, loads=Math.round(fill*positions);
  const order=Array.from({length:positions},(_,i)=>i).sort((a,b)=>{
   const priority=i=>!bays?i:(i%8)*93+(i%8)*11+((i>>3)*7)%12;
   return priority(a)-priority(b);
  });
  const floorMode=bays===0;
  const fleet=Math.min(3,count(v.trucks));
  const assigned=Math.min(fleet,count(v.assignedTrucks));
  return {fit,fill,bays,racks,positions,loads,loaded:new Set(order.slice(0,loads)),fleet,assigned,floorMode};
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
 function rackPallet(x,y,z,variant){
  // Runners span the front and rear load beams; the three ends leave two fork openings.
  let art='';
  for(const dx of [.025,.444,.864])art+=box(x+dx,y,.155,1.20,.088,'wood',z);
  return art+box(x,y,1.045,1.20,.052,'wood',z+.088)+
   box(x+.04,y+.07,.965,1.06,.95,'goods'+variant,z+.14)+
   [x+.27,x+.8].map(a=>line([[a,y+.07,z+.15],[a,y+.07,z+1.09],[a,y+1.13,z+1.09]],'#eadebf',.78)).join('');
 }
 function bay(x,y,i,m,rackFire,pickup) {
  const span=2.73,depth=1.10,top=6.65,levels=rackLevels,beamHeight=.12;
  let art='<g class="d21-rack-bay" data-levels="4" data-pallets-per-level="2">';
  for(const xx of [x,x+span]){
   art+=box(xx-.06,y+depth-.068,.12,.136,top,'blue');
   for(let tier=0;tier<4;tier++){
    const z=levels[tier]+.06, hi=tier<3?levels[tier+1]-.08:top;
    art+=line(tier%2?[[xx,y+depth,z],[xx,y,hi]]:[[xx,y,z],[xx,y+depth,hi]],'#6d8590',1.3);
   }
  }
  for(let tier=3;tier>=0;tier--){
   const z=levels[tier];
   // The rear support is painted first: it is visible beside/through gaps, not over stock.
   if(tier>0)art+='<g class="d21-rear-load-beam">'+
    box(x+.055,y+depth-.035,span-.11,.07,beamHeight,'beam',z-beamHeight)+'</g>';
   if(rackFire&&(tier===2||tier===3)){
    art+='<g class="d20-rack-pipework">'+line([[x,y+depth,z+1.32],[x+span,y+depth,z+1.32]],'#a74537',1.4)+dot(x+1.35,y+1.27,z+1.24,1.35,'#e5a047')+'</g>';
   }
   for(let j=0;j<2;j++)if(m.loaded.has(i*8+tier*2+j)){
    const xx=x+.235+j*1.22;art+='<g class="d21-pallet'+(pickup?.bay===i&&pickup.slot===tier*2+j?' d21-retrieval-source':'')+'">'+rackPallet(xx,y-.026,z,(i+tier+j)%3+1)+'</g>';
   }
  }
  // Paint the aisle-facing face last, so the slim 120 mm profile reads as an unbroken support.
  for(const z of levels.slice(1))art+='<g class="d21-front-load-beam">'+
   box(x+.055,y-.047,span-.11,.075,beamHeight,'beam',z-beamHeight)+'</g>';
  for(const xx of [x,x+span]){
   art+=box(xx-.072,y-.075,.144,.15,top,'blue')+line([[xx,y,top],[xx,y+depth,top]],'#6e8791',1.6);
   for(const z of levels.slice(1))art+=box(xx-.078,y-.081,.156,.045,.18,'beam',z-.16);
   art+=box(xx-.135,y-.13,.27,.28,.055,'steel');
  }
  return art+'</g>';
 }
 function walker(x,y,i){
  const [a,b]=P(x,y), delta=P(x,y+(i%2?3.2:-3.2)).map((c,k)=>c-[a,b][k]);
  return '<g transform="translate('+a+' '+b+')"><g class="d21-worker d21-shuttle" style="--dx:'+delta[0]+'px;--dy:'+delta[1]+'px;--period:'+(5.6+i*.8)+'s;--delay:-'+(i*.73)+'s"><ellipse cx="0" cy="1" rx="4.6" ry="1.8" fill="#343a30" opacity=".26"/><path class="d21-stride" d="M-2 -7l-1 5-2 2M2 -7l2 4 2 2" stroke="#33424a" stroke-width="2.3" stroke-linecap="round" fill="none"/><path d="M-3 -15l-3 5m9-5 3 4" stroke="#526b75" stroke-width="1.9" stroke-linecap="round"/><path d="M-3 -16h6l1 8h-8z" fill="#e4a13b" stroke="#80562e" stroke-width=".65"/><path d="M-3.7 -11h7.4" stroke="#f7e7ad" stroke-width="1.4"/><circle cy="-18.5" r="2.25" fill="#b9845d"/><path d="M-3 -19.3a3 2.8 0 0 1 6 0z" fill="#edbc57"/></g></g>';
 }
 function forkliftArt(active,moveForks=false){
  return '<ellipse cx="1" cy="2" rx="16" ry="5" fill="#34392f" opacity=".2"/><path d="M-13 -5l18 5 12-7-18-5z" fill="#e6ad4f"/><path d="M-13 -5l18 5v5l-18-5zm18 5 12-7v5l-12 7z" fill="#c78930"/><circle cx="-8" cy="2" r="3.6" fill="#333d3b"/><circle cx="4" cy="5" r="4.2" fill="#333d3b"/><circle cx="13" cy="-1" r="3.4" fill="#333d3b"/><path d="M-11 -5v-16l15 4v16m0-16 9-5v16m-24-15 9-5 15 4" fill="none" stroke="#36464a" stroke-width="2"/>'+(active?'<path d="M-3 -8v-6l5 1v6z" fill="#e4a13b"/><circle cx="-1" cy="-16" r="2" fill="#eec761"/>':'')+'<path d="M14 -2v-17m4 15v-17" fill="none" stroke="#4d5756" stroke-width="2" stroke-linecap="round"/>'+(moveForks?'<path class="d21-live-forks" d="M14 -7l19 5m-16-8 19 5" fill="none" stroke="#444e4f" stroke-width="2.2" stroke-linecap="round"/>':'<path d="M14 -2l11 3m-7-5 11 3" fill="none" stroke="#4d5756" stroke-width="2" stroke-linecap="round"/>');
 }
 function forklift(x,y,active,i){
  const [a,b]=P(x,y),delta=P(x-3.7,y).map((c,k)=>c-[a,b][k]);
  return '<g transform="translate('+a+' '+b+')"><g class="d21-forklift'+(active?' d21-shuttle':'')+'" style="--dx:'+delta[0]+'px;--dy:'+delta[1]+'px;--period:'+(7+i*.8)+'s;--delay:-'+(i*1.2)+'s">'+forkliftArt(active)+'</g></g>';
 }
 function pickupPoint(m,dock,v){
  if(!dock||!m.assigned||!(v.moves>0)||!m.loads)return null;
  if(m.floorMode)return {bay:-1,slot:m.loads>12?1:0,x:4.3,y:8.45,z:.02+(m.loads>12?1.18:0),variant:m.loads>12?2:1};
  const bay=layout.findIndex((_,i)=>i<m.bays&&i<6&&Array.from({length:8},(_,j)=>j).some(j=>m.loaded.has(i*8+j)));
  if(bay<0)return null;
  const [x,y]=layout[bay], slot=[4,5,2,3,6,7,0,1].find(j=>m.loaded.has(bay*8+j));
  return {bay,slot,x:x+.235+(slot%2)*1.22,y:y-.026,z:rackLevels[Math.floor(slot/2)],variant:(bay+Math.floor(slot/2)+slot%2)%3+1};
 }
 function dispatchFork(p,dock){
  const dockX=dock.x+dock.width/2;
  // Route: rack-face aisle, west cross-aisle, then the parked lorry's rear at the open dock.
  const [sx,sy]=P(p.x,p.y,0), pick=[sx-18,sy+7];
  const stage=P(2.05,p.y-1.75), dockSide=P(2.05,23.1);
  const threshold=P(dockX,24.25), setDown=P(dockX,26.0).map((n,i)=>n-[22,1][i]);
  const pts=[stage,pick,stage,dockSide,threshold,setDown];
  const vars=pts.map((a,i)=>'--f'+i+':'+a.map(n=>n+'px').join(',')).join(';')+';--lift:'+(-p.z*12.85)+'px';
  const carried='<g class="d21-carried-pallet"><g transform="translate(-86 -357)">'+(p.bay<0?pallet(0,0,.02,p.variant):rackPallet(0,0,.02,p.variant))+'</g></g>';
  return '<g class="d21-dispatch-fork" style="'+vars+'" aria-hidden="true"><g class="d21-dispatch-mast">'+carried+forkliftArt(true,true)+'</g></g>'+
   '<g class="d21-dispatch-static" aria-hidden="true">'+forklift(2.05,p.y-1.75,false,0)+'</g>';
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
 function yardDelivery(dock,moves,frontage) {
  if(!dock||!(moves>0))return {exterior:'',interior:''};
  const x=dock.x+dock.width/2, y=29.39;
  const coords=[[-33,47.5],[0,47.5],[.8,39.5],[x+5,36.75],[x,36.75],[x,y],
    [x,36.75],[.6,39.8],[0,47.5],[frontage+20,47.5]];
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
 function grounds(docks,site,hit){
  const w=site.width;
  let art='<g class="d21-landscape">'+
   plane(-8.5,-33,w+16,76,'#b9c895',.001,'#a2b588')+
   plane(-8,-32,7.5,70,'#aac088',.005)+plane(-.5,-32,w+.5,5,'#afc38d',.006)+
   plane(0,27,w,15,'#afc38c',.006);
  art+='<g class="d21-public-road">'+hit('handling','Public road and lorry traffic',plane(-28,44,w+58,7,'#68716a',.008)+
   line([[-28,44.23,.02],[w+30,44.23,.02]],'#e0dfcb',1.35)+
   line([[-28,50.75,.02],[w+30,50.75,.02]],'#e0dfcb',1.35)+
   line([[-28,47.5,.025],[w+30,47.5,.025]],'#eae6cc',1.5,'11 8'))+'</g>';
  art+='<g class="d21-loading-yard">'+hit('docks','Loading yard',plane(-3,26,site.frontage+5,16.5,'#92958a',.03,'#7d8779')+
   plane(-3,42.3,7,2,'#92958a',.032)+line([[4,42.5,.05],[site.frontage+2,42.5,.05]],'#d5d8bd',1.25));
  for(const {x,width} of docks){
   const c=x+width/2;
   for(const side of [c-2.2,c+2.2])art+=line([[side,26.5,.045],[side,35.3,.045]],'#d7d8c1',.9);
  }
  art+='</g>'+hedgerow(6,w+4,43.5);
  for(let x=7,i=0;x<w+5;x+=6.6,i++){art+=tree(x,42.85,i);art+=tree(x-4,-30,i+2);}
  for(let y=-25,i=0;y<41;y+=6.4,i++){art+=tree(-6.4,y,i);art+=tree(w+5,y,i+1);}
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
 // Welfare sits in the starter building beside the management office, clear of the racking.
 function canteen(tier,hit){
  if(!Number.isInteger(tier)||tier<1||tier>3)return '';
  const x=3,y=.55,w=12.7,d=4.68,frame='#537679',tile=['','#d7c995','#d8c8a8','#87a69f'][tier];
  const wood=['#d9b583','#b1875d','#8d6246'], metal=['#c0d2cf','#839c9d','#637c81'];
  const dining=(a,b)=>{
   let art=box(a+.15,b+.25,.14,.15,.65,'steel',.13)+box(a+1.57,b+.25,.14,.15,.65,'steel',.13)+
    box(a,b,1.86,.85,.14,wood,.76);
   for(const c of [a+.2,a+1.1])art+=box(c,b-.45,.5,.34,.35,'warm',.13);
   art+=box(a+.18,b+1.0,.54,.35,.36,'mint',.13)+box(a+1.08,b+1.0,.54,.35,.36,'mint',.13);
   return art+dot(a+.48,b+.45,.93,1.65,'#f6e9d5')+dot(a+1.36,b+.45,.93,1.65,'#f6e9d5');
  };
  let art='<g class="d31-canteen d31-canteen-'+tier+'" data-welfare-tier="'+tier+'">'+
   box(x,y,w,d,.10,'clad',.02)+plane(x+.08,y+.08,w-.16,d-.16,tile,.13,frame)+
   face([[x,y+d,.13],[x+w,y+d,.13],[x+w,y+d,2.05],[x,y+d,2.05]],'#a4bbaa50',frame,1.05);
  for(const a of [x+2,x+5,x+8,x+11])art+=line([[a,y+d,.14],[a,y+d,2.05]],frame,1.1);
  art+=line([[x,y+d,2.05],[x+w,y+d,2.05]],'#82999a',1.65);
  if(tier===1){
   art+='<g class="d31-cold-counter">'+box(x+.45,y+2.65,3.55,.78,.83,wood,.13)+
    box(x+.55,y+2.78,.68,.48,.3,'mint',.97)+box(x+1.71,y+2.8,.5,.46,.43,'steel',.97)+
    dot(x+1.95,y+3.02,1.41,1.5,'#dbab54')+'</g>';
   art+=dining(x+4.85,y+1.38)+dining(x+8.65,y+1.38);
  }else{
   art+='<g class="d31-hot-kitchen">'+box(x+.42,y+3.37,3.70,.78,.86,metal,.13)+
    box(x+.42,y+3.48,3.66,.72,.23,'steel',1.84);
   for(const a of [x+.65,x+1.72,x+2.79])art+=plane(a,y+3.50,.76,.45,'#b1663b',1.02,'#e5ad71');
   art+=box(x+1.07,y+1.43,2.82,.88,.91,wood,.13)+
    plane(x+1.29,y+1.59,.70,.51,'#e9a76a',1.06,frame)+plane(x+2.23,y+1.59,.72,.51,'#e3b95d',1.06,frame)+
    line([[x+1.18,y+1.76,1.2],[x+1.18,y+1.76,1.66],[x+3.77,y+1.76,1.66],[x+3.77,y+1.76,1.2]],'#c6dfdd',1.6)+'</g>';
   if(tier===2)art+=dining(x+4.96,y+1.45)+dining(x+8.65,y+1.45);
   else{
    const px=x+5.15,py=y+2.06, tvx=x+10.66,tvy=y+3.45;
    art+='<g class="d31-pool-table">'+box(px+.25,py+.18,.2,.24,.74,'steel',.13)+box(px+2.38,py+.92,.20,.23,.74,'steel',.13)+
     box(px,py,2.94,1.42,.20,wood,.83)+plane(px+.16,py+.145,2.62,1.13,'#237866',1.05,'#a3d7ac')+
     dot(px+.64,py+.58,1.08,1.7,'#f5e8cc')+dot(px+1.82,py+.77,1.08,1.6,'#efb048')+
     dot(px+2.02,py+.70,1.08,1.6,'#c9634c')+line([[px+.29,py+.24,1.14],[px+1.44,py+.98,1.14]],'#e1c091',1.05)+'</g>';
    art+='<g class="d31-games-console">'+box(tvx-.22,tvy-.21,1.74,.46,.57,'dark',.13)+
     face([[tvx,tvy,.73],[tvx+1.31,tvy,.73],[tvx+1.31,tvy,1.66],[tvx,tvy,1.66]],'#213641',frame,1.5)+
     face([[tvx+.10,tvy-.012,.86],[tvx+1.22,tvy-.012,.86],[tvx+1.22,tvy-.012,1.55],[tvx+.10,tvy-.012,1.55]],'#79afc8')+
     line([[tvx+.15,tvy-.022,1.05],[tvx+.52,tvy-.022,1.28],[tvx+.87,tvy-.022,1.07],[tvx+1.16,tvy-.022,1.21]],'#dff2dc',1.3)+
     box(tvx+1.37,tvy+.03,.1,.25,.32,'clad',.72)+box(x+9.97,y+1.27,2.45,.66,.47,'mint',.13)+
     box(x+9.97,y+1.22,2.45,.18,.85,'mint',.13)+'</g>';
   }
  }
  art+=face([[x,y,.13],[x+w,y,.13],[x+w,y,.58],[x,y,.58]],'#799b94',frame,1.03)+'</g>';
  return hit('welfare',['','Basic canteen','Hot-food canteen','Staff lounge'][tier],art);
 }
 function automationShell(x,y){
  const w=10.18,d=9.23,z=6.8,metal=['#b4c5c5','#859d9f','#647e84'];
  let shell='<g class="d21-automation d28-auto-shell">';
  for(const xx of [x,x+w])for(const yy of [y,y+d])shell+=box(xx-.085,yy-.085,.17,.17,z,metal)+box(xx-.17,yy-.18,.34,.36,.1,'steel');
  shell+=box(x,y,w,.23,.255,metal,z-.18)+box(x,y+d-.23,w,.23,.255,metal,z-.18)+
   box(x,y,.23,d,.23,metal,z-.18)+box(x+w-.23,y,.23,d,.23,metal,z-.18);
  for(const xx of [x+1.1,x+w/2,x+w-1.1])shell+=box(xx,y+.18,.15,d-.36,.12,metal,z+.04);
  const outer=x+w-.13;
  // Two see-through safety faces: side return and the long face toward the aisle.
  const low=.18,high=4.60,mesh='#637f8580';
  const near=y+.02;
  shell+='<g class="d28-auto-mesh-side">'+face([[outer,y,low],[outer,y+d,low],[outer,y+d,high],[outer,y,high]],'#8fa6a43d','#91a9ae',1.25);
  for(let a=y+.48;a<y+d;a+=.50)shell+=line([[outer,a,low],[outer,a,high]],mesh,.59);
  for(let h=.53;h<high;h+=.38)shell+=line([[outer,y,h],[outer,y+d,h]],mesh,.59);
  shell+='</g>';
  shell+='<g class="d28-auto-mesh-front">'+face([[x,near,low],[x+w,near,low],[x+w,near,high],[x,near,high]],'#92a5a030','#a0b3b2',1.35);
  for(let a=x+.48;a<x+w;a+=.50)shell+=line([[a,near,low],[a,near,high]],mesh,.59);
  for(let h=.53;h<high;h+=.38)shell+=line([[x,near,h],[x+w,near,h]],mesh,.59);
  shell+=line([[x+w*.47,near,low],[x+w*.47,near,high]],'#82999e',1.7)+line([[x+w*.54,near,low],[x+w*.54,near,high]],'#82999e',1.7)+'</g>';
  const [a,b]=P(x+w-.30,y+.01,5.94);
  shell+='<g transform="translate('+a+' '+b+')"><rect x="-14" y="-10" width="28" height="20" rx="4" fill="#223840" stroke="#c1d1d2"/><path d="M0 -4v-3m-7 7h-2m16 0h2M-5 -4h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H-5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z" fill="none" stroke="#ecf1ed" stroke-width="1.2"/><circle cx="-2.7" cy=".8" r="1.05" fill="#a8ece3"/><circle cx="2.7" cy=".8" r="1.05" fill="#a8ece3"/></g>';
  for(const [xx,yy] of [[x+.65,y],[x+w-.35,y],[outer,y+d-.40]]){
   const [a,b]=P(xx,yy,z+.25);shell+='<g class="d28-auto-lamp" transform="translate('+a+' '+b+')"><rect x="-2" y="-3" width="4" height="5" rx=".7" fill="#4b5350"/><circle cy="-3" r="2.7" fill="#eeb45b"/></g>';
  }
  return shell+'</g>';
 }
 function yard(v,m) {
  const site=estate(v), docks=dockPlan(v.dockDoors,site.sections),clad='#d3d3c8',edge='#778381', steel='#586c71';
  const unique=new Set(), idx=Number.isInteger(v.siteIndex)&&v.siteIndex>=0?v.siteIndex:0;
  const hit=(key,label,shape)=>{
   const first=!unique.has(key);unique.add(key);
   return '<g class="d21-scene-hit" role="button" tabindex="'+(first?'0':'-1')+'" data-scene-hit="'+key+'" data-scene-site="'+idx+'" aria-label="'+esc(label)+'"><title>'+esc(label)+'</title>'+shape+'</g>';
  };
  let art=grounds(docks,site,hit);
  const primary=docks.find(d=>d.id===1);
  const pickup=pickupPoint(m,primary,v), delivery=yardDelivery(primary,v.moves,site.frontage);
  if(delivery.exterior)art+=hit('handling','Lorry traffic',delivery.exterior);
  const present=new Set(site.cells.map(c=>c.join(',')));
  const exists=(c,r)=>present.has(c+','+r);
  for(const [i,[c,r]] of site.cells.entries()){
   const x=c*tileW,y=-r*tileD;
   let floor='<g class="d21-floor-section" data-built-section="'+i+'">'+plane(x,y,tileW,tileD,'#c6c5b9',.009);
   for(let a=4;a<tileW;a+=4.5)floor+=line([[x+a,y,.02],[x+a,y+tileD,.02]],'#a1a396',.60);
   for(let a=4;a<tileD;a+=4.5)floor+=line([[x,y+a,.02],[x+tileW,y+a,.02]],'#a1a396',.60);
   // Shared edges are expansion joints, never outside walls or raised slabs.
   if(!exists(c+1,r))floor+=face([[x+tileW,y,-.45],[x+tileW,y+tileD,-.45],[x+tileW,y+tileD,0],[x+tileW,y,0]],'#6d716b',edge,.9);
   if(!exists(c,r+1))floor+=face([[x,y,-.45],[x+tileW,y,-.45],[x+tileW,y,0],[x,y,0]],'#86847a',edge,.9);
   if(c>0&&!exists(c-1,r))floor+=face([[x,y,0],[x,y+tileD,0],[x,y+tileD,1.3],[x,y,.65]],'#bdc2b7',edge,1.05);
   floor+=hit(i?'expansion':'storage',i?'Warehouse extension '+i:'Warehouse floor and racking',plane(x+.25,y+.22,tileW-.5,tileD-.44,'transparent',.027));
   art+=floor+'</g>';
  }
  const rear=(x,w,h,z=0)=>w>0?face([[x,wallY,z],[x+w,wallY,z],[x+w,wallY,z+h],[x,wallY,z+h]],clad,edge):'';
  // Back walls are drawn before the contents, with the first real dock cut open.
  let prev=0;
  for(let i=0;i<docks.length;i++) {
   const {x,width:w,id}=docks[i], open=id===1&&v.moves>0;
   art+=rear(prev,x-prev,5.25);
   let door='<g class="d21-dock-door" data-dock="'+id+'" data-dock-centre="'+(x+w/2)+'">';
   door+=face([[x,26,0],[x+w,26,0],[x+w,26,3.85],[x,26,3.85]],open?'#5577762b':'#788687',steel,1.6);
   if(!open)for(let z=.30;z<3.85;z+=.30)art+=line([[x+.12,25.97,z],[x+w-.12,25.97,z]],'#a1aaa3',.72);
   door+=open?line([[x,26,3.85],[x,26,5.25],[x+w,26,5.25],[x+w,26,3.85]],steel,1.35):rear(x,w,1.4,3.85);
   const kerb=Math.min(.22,w*.09);
   for(const xx of [x-kerb,x+w+kerb])art+=line([[xx,25.72,0],[xx,25.72,.86]],'#dea448',2.1);
   door+=line([[x,25.43,.03],[x,22.6,.03],[x+w,22.6,.03],[x+w,25.43,.03]],'#bf913d',1.12)+'</g>';
   art+=hit('docks','Dock door '+id,door);
   prev=x+w;
  }
  art+=rear(prev,site.frontage-prev,5.25);
  art+=line([[0,26,5.25],[site.frontage,26,5.25]],steel,2.1);
  art+=face([[0,0,0],[0,26,0],[0,26,5.25],[0,0,2.26]],'#bdc2b7',edge);
  art+=line([[0,0,2.26],[0,26,5.25]],steel,2.1);
  if(exists(0,1))art+=face([[0,-26,0],[0,0,0],[0,0,2.26],[0,-26,1.20]],'#bdc2b7',edge);
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
  m.racks.forEach(([x,y],i)=>add(x,y,hit('storage','Pallet racking',bay(x,y,i,m,i<Math.round(m.bays*proportion(count(fire.rack),div)),pickup))));
  // Unracked storage uses representative, two-high block stacks on the slab.
  if(m.floorMode&&m.loads){
   for(let i=0;i<12;i++){
    const x=4.3+(i%4)*1.27,y=8.45+Math.floor(i/4)*1.42;
    const layers=Number(i<m.loads)+Number(i+12<m.loads);
    if(!layers)continue;
    let load='';
    for(let tier=0;tier<layers;tier++)load+='<g class="d21-pallet'+(pickup?.bay===-1&&i===0&&pickup.slot===tier?' d21-retrieval-source':'')+'">'+pallet(x,y,.02+1.18*tier,(i+tier)%3+1)+'</g>';
    add(x,y,hit('stock-levels','Bulk pallet stacks','<g class="d21-bulk-stack" data-tiers="'+layers+'">'+load+'</g>'));
   }
  }
  for(let i=0;i<Math.min(5,count(v.staff));i++){
   const x=i===4?29.8:31.6,y=[4.9,10.2,16.1,22.5,23.7][i];
   add(x,y,hit('handling','Warehouse staff',walker(x,y,i)));
  }
  if(!m.fleet&&v.staff>0&&v.moves>0){
   const x=v.welfareTier?14.2:7.6,y=v.welfareTier?5.57:3.2;
   add(x,y,hit('handling','Pallet truck and handling','<g class="d21-pallet-jack">'+box(x,y,.57,.41,.17,'warm')
    +line([[x+.18,y,.08],[x+.18,y+.93,.08]],'#b66f31',2.1)
    +line([[x+.48,y,.08],[x+.48,y+.93,.08]],'#b66f31',2.1)
    +line([[x+.31,y-.02,.17],[x+.31,y-.38,.86]],'#53706a',1.65)
    +line([[x+.14,y-.38,.86],[x+.47,y-.38,.86]],'#53706a',1.65)+'</g>'));
  }
  for(let i=pickup?1:0;i<m.fleet;i++){
   const x=[18.0,24.2,29.1][i],y=[10.7,18.8,21.4][i];
   // Vehicles are drawn in clear vehicle lanes. Parked leases never imply operating capacity.
   add(x,y,hit('mhe','Forklift and leased equipment',forklift(x,y,i<m.assigned&&v.moves>0,i)));
  }
  art+=items.sort((a,b)=>b.depth-a.depth).map(x=>x.paint).join('');
  const installed=new Set(v.automatedSections||Array.from({length:count(v.automated)},(_,i)=>i));
  for(const i of installed)if(Number.isInteger(i)&&i>=0&&i<site.sections){
   const [x,y]=sectionOrigin(i);
   art+=hit('automation','Automated racking and shuttle, section '+(i+1),automationShell(x+3.55,y+5.78));
  }
  if(pickup)art+=hit('mhe','Forklift carrying a pallet to the dock',dispatchFork(pickup,primary));
  const protectedBays=Math.round(m.bays*proportion(count(fire.rack),div));
  if(protectedBays){
   const rackTargets=m.racks.slice(0,protectedBays).map(([x,y])=>line([[x,y+1.30,6.88],[x+2.73,y+1.30,6.88]],'transparent',13)).join('');
   art+=hit('rack-fire','In-rack sprinkler system',rackTargets);
  }
  if(!pickup&&delivery.interior)art+=hit('handling','Unloading and handling',delivery.interior);
  art+=office(v,hit)+canteen(v.welfareTier,hit);
  // Draw external plant and in-building sprinklers only on commissioning.
  if(fire.water>0){
   const tx=-3.8,ty=-3.6,[x,y]=P(tx,ty,.02);
   let plant='<g class="d20-water-tank">'+shadow(tx,ty,38,11)+'<path d="M'+(x-30)+' '+(y-48)+'v44c0 15 60 15 60 0v-44Z" fill="#527b70" stroke="#3c665e" stroke-width="1.45"/><ellipse cx="'+x+'" cy="'+(y-48)+'" rx="30" ry="9" fill="#96ad9f" stroke="#3c665e" stroke-width="1.45"/><ellipse cx="'+(x+4)+'" cy="'+(y-49)+'" rx="6" ry="2.7" fill="#627d70"/>';
   for(const z of [8,19,29,40])plant+='<path d="M'+(x-30)+' '+(y-z)+'q30 14 60 0" stroke="#a5b8a7" stroke-opacity=".68" fill="none"/>';
   plant+='</g><g class="d20-pump-house">'+box(-5,1,2.35,1.87,1.69,'clad')+box(-5.11,.9,2.57,2.07,.14,'steel',1.69)+'</g>';
   plant+=line([[tx,-1.6,.43],[tx,1,.43],[0,1,.43]],'#a94437',2.5);
   art+=hit('tank','Sprinkler tank and pump house',plant);
  }
  if(fire.roof>0){
   let pipes='<g class="d20-roof-pipework">';
   for(let i=0;i<Math.min(site.sections,count(fire.roof));i++){
    const [a,b]=sectionOrigin(i);
    pipes+=line([[a+2,b+21.37,7.4],[a+31,b+21.37,7.4]],'#a74336',2.45);
    for(const xx of [6,13,20,27]){
     const x=a+xx;
     pipes+=line([[x,b+21.37,7.4],[x,b+8.1,7.4]],'#af5946',1.35);
     for(const yy of [9.5,14.6,19.7]){
      const y=b+yy;
      pipes+=line([[x,y,7.4],[x,y,7.14]],'#a74336',1.1)+dot(x,y,7.10,1.45,'#b77e3d');
     }
    }
    pipes+=line([[a+2,b+21.37,7.4],[a+31,b+21.37,7.4]],'transparent',12);
   }
   art+=hit('roof','Roof sprinkler system',pipes+'</g>');
  }
  const [bx,by]=sectionOrigin(site.sections);
  if(site.queued){
   const x=bx+.3,y=by+.3,w=tileW-.6,d=tileD-.6;
   let works='<g class="d21-extension-works">'+plane(x,y,w,d,'#c3ac83',.045,'#b3833b')+
    line([[x,y,.08],[x+w,y,.08],[x+w,y+d,.08],[x,y+d,.08],[x,y,.08]],'#9c6e2d',2,'6 4');
   if(site.queued.remaining<=4)for(const xx of [x,x+w])for(const yy of [y,y+d])works+=line([[xx,yy,0],[xx,yy,4.3]],'#687571',2.5);
   if(site.queued.remaining<=2)works+=line([[x,y,4.3],[x+w,y,4.3],[x+w,y+d,4.3],[x,y+d,4.3],[x,y,4.3]],'#687571',2.1);
   art+=hit('projects','Expansion in progress',works+'</g>');
  }
  const marks={dock:[26,28,3],handling:[24,19,2.5],storage:[11,12,6],idle:[32,6,1.8],works:[bx+9,by+6,3]};
  for(const d of (v.diagnostics||[])){
   const coord=marks[d.type];if(!coord)continue;
   const [x,y]=P(...coord), warn=d.tone==='warn', ink=warn?'#933b30':'#23475c';
   const shape='<g class="d24-scene-mark" data-diagnostic="'+esc(d.type)+'"><circle cx="'+x+'" cy="'+y+'" r="25" fill="transparent"/><circle cx="'+x+'" cy="'+y+'" r="14" fill="'+ink+'" stroke="#fff5de" stroke-width="2"/>'+
    (warn?'<path d="M'+x+' '+(y-7)+'v9m0 4v1" stroke="white" stroke-width="3" stroke-linecap="round"/>':'<path d="M'+x+' '+(y-7)+'v1m0 4v8" stroke="white" stroke-width="3" stroke-linecap="round"/>')+'</g>';
   art+=hit(d.route,d.label,shape);
  }

  return art;
 }
 function cameraAt(n){return [camera[0]+n*tileW*14.2,camera[1]+n*tileW*4.45,...camera.slice(2)].join(' ');}
 function render(v){
  const maxPan=estate(v).columns-2, step=cap(count(v.estateStep),0,maxPan), m=model(v), mode=Object.hasOwn(panels,v.mode)?v.mode:'floor';
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
  return '<figure data-yard-site="'+(idx??0)+'" class="d21-yard-view'+(v.motion===false?' d21-paused':'')+'" data-fit="'+percent(m.fit)+'" data-occupancy="'+percent(m.fill)+'"><div class="d21-yard-head"><b>Warehouse view</b><button type="button" data-scene-zoom="'+(idx??0)+'">Enlarge</button></div><svg class="d21-yard-svg" viewBox="'+cameraAt(step)+'" role="group" data-scene-default="'+(idx??0)+'" aria-label="Warehouse view: '+percent(m.fit)+' racking installed, '+percent(m.fill)+' of pallet spaces booked this month, '+num(v.staff)+' staff, '+num(v.sections)+' sections, '+num(count(v.dockDoors))+' dock doors ready to use, loading yard and road beside landscaped grounds. Office: '+officeRoles(v).map(r=>esc(r.label)+(r.filled?' appointed':' not appointed')).join(', ')+'">'+yard({...v,mode},m)+'</svg>'+(maxPan>0?'<div class="d29-estate-controls" data-estate-max="'+maxPan+'" data-estate-step="'+step+'" aria-label="View more of the same site"><button type="button" data-estate-pan="-1" aria-label="View previous part of warehouse"'+(step===0?' disabled':'')+'>←</button><output aria-live="polite">Site view '+(step+1)+' / '+(maxPan+1)+'</output><button type="button" data-estate-pan="1" aria-label="View next part of warehouse"'+(step===maxPan?' disabled':'')+'>→</button></div>':'')+'<figcaption><small class="d21-yard-tip">Tap an object or a warehouse alert to manage it.</small>'+(signals?'<div class="d24-signals" aria-label="Warehouse alerts">'+signals+'</div>':'')+'<div class="d21-yard-controls" aria-label="Warehouse view">'+Object.entries(panels).map(([k,label])=>'<button class="d13-mode" data-scene-mode="'+k+'" aria-pressed="'+(k===mode)+'">'+label+'</button>').join('')+'<button type="button" data-scene-motion aria-label="'+(v.motion===false?'Resume motion':'Pause motion')+'">'+'<svg viewBox="0 0 18 18" width="15" height="15" aria-hidden="true" fill="currentColor">'+(v.motion===false?'<path d="M5 3l10 6-10 6z"/>':'<path d="M5 3h3v12H5zm5 0h3v12h-3z"/>')+'</svg>'+'</button></div>'+(mode==='floor'?stock:mode==='flow'?flow:build)+(status.length?'<p class="d21-yard-fire">'+status.map(esc).join(' · ')+'</p>':'')+'<div class="d21-yard-links">'+links.map(([id,label])=>'<button type="button" data-scene-hit="'+id+'" data-scene-site="'+(idx??0)+'">'+label+' <span aria-hidden="true">›</span></button>').join('')+'</div></figcaption></figure>';
 }
 function pan(control,step){
  const svg=control.previousElementSibling;
  const max=Number(control.dataset.estateMax),n=cap(count(step),0,max);
  control.dataset.estateStep=n;
  svg.setAttribute('viewBox',cameraAt(n));
  control.querySelector('output').textContent='Site view '+(n+1)+' / '+(max+1);
  control.querySelector('[data-estate-pan="-1"]').disabled=n===0;
  control.querySelector('[data-estate-pan="1"]').disabled=n===max;
  return n;
 }
 return {render,model,pan,estate,dockPlan};
})();
