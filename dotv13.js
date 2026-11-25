/* DOTv13 presentation only. No prices, dates, random draws or save mutations here. */
(() => {
 const safe=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const num=x=>Math.round(x).toLocaleString('en-GB');
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const attr=x=>safe(x);
 const pos={north:[159,113],mid:[177,185],south:[218,242]};
 const themes=['#fd9d84','#ffe285','#b9a8fc','#89d6f5','#eca8cf','#c7df97'];
 const modes={floor:'Floor',flow:'Pallet flow',build:'Build queue'};
 function status(moves,capacity){return moves>capacity?['bad','Over capacity']:moves===0?['quiet','No moves committed']:moves>=capacity*.85?['watch','Near capacity']:['good','Capacity available'];}
 function gauge(label,val,max,unit){
  const pct=max?Math.round(val/max*100):val?100:0;
  const cls=val>max?'bad':pct>=85?'watch':'good';
  return `<div class="d13-gauge ${cls}"><div><b>${safe(label)}</b><span>${num(val)} / ${num(max)} ${unit}</span></div><div class="d13-meter" role="meter" aria-label="${attr(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${clamp(pct,0,100)}"><i style="width:${clamp(pct,0,100)}%"></i></div></div>`;
 }
 function warehouse(v){
  const mode=modes[v.mode]?v.mode:'floor', [loadClass,loadName]=status(v.moves,v.capacity);
  const pt=(x,y,z=0)=>(325+(x-y)*24)+','+(85+(x+y)*11-z);
  const face=(ps,fill,stroke='#242f3e',w=1.35)=>`<polygon points="${ps.map(p=>pt(...p)).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round"/>`;
  const ground=(x,y,w,d,z,fill,line,width)=>face([[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z]],fill,line,width);
  const box=(x,y,w,d,h,c,z=0)=>face([[x,y+d,z+h],[x+w,y+d,z+h],[x+w,y+d,z],[x,y+d,z]],c[1])+face([[x+w,y,z+h],[x+w,y+d,z+h],[x+w,y+d,z],[x+w,y,z]],c[2])+ground(x,y,w,d,z+h,c[0]);
  const line=(ps,color,width=1,dash='')=>`<polyline points="${ps.map(p=>pt(...p)).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${dash?' stroke-dasharray="'+dash+'"':''}/>`;
  const wall=(x,y,w,h)=>face([[x,y,6],[x+w,y,6],[x+w,y,h],[x,y,h]],'#6f96a6','#273c4c');
  const chip=(x,y,z,msg,w)=>{const [a,b]=pt(x,y,z).split(',').map(Number);return `<g><rect x="${a-w/2}" y="${b-15}" width="${w}" height="24" rx="6" fill="#132535" stroke="#ebc375"/><text x="${a}" y="${b+1}" text-anchor="middle" fill="#fff4d9" font-size="11" font-weight="700">${safe(msg)}</text></g>`;};
  let art=ground(-1,-2,13.1,14.4,-5,'#3b5e55','#6f8271',2)+box(-.4,-.25,11.1,11.1,4,['#6e8080','#253c43','#3b4d53']);
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
  const docks=[2,4.8,7.6];
  docks.forEach((x,i)=>{
   art+=ground(x-.17,8,1.4,2.6,4.3,i===2?'#647379':'#5c6b70','#c6b58e',1.05);
   art+=box(x,7.77,1.05,.47,13,['#a2b5b0','#293e4d','#4b6168'],4);
   for(let j=0;j<3;j++)art+=line([[x+.16,8.25,7+j*2.2],[x+.94,8.25,7+j*2.2]],'#849399',.9);
  });
  if(v.moves){
   for(let i=0;i<Math.min(2,Math.ceil(v.moves/8000));i++){
    const x=2+i*2.8,y=8.35;
    art+=box(x,y,1.12,1.55,19,['#f5eed4','#c7ccba','#899895'],4)+box(x,y+1.55,1.12,.72,12,[i?'#82a8bd':'#ffb45f',i?'#517e91':'#b3774e','#49656e'],4);
    art+=line([[x+.1,y+2.28,12],[x+.93,y+2.28,12]],'#193e55',2.1);
    for(let w of [y+.28,y+1.95]){const [wx,wy]=pt(x+1.12,w,6).split(',');art+=`<ellipse cx="${wx}" cy="${wy}" rx="3.5" ry="4.3" fill="#22323b"/>`;}
   }
  }
  if(v.staff&&v.moves)art+=`<g class="d13-forklift">${box(7.4,5.61,.78,.51,8,['#fbd476','#d7924f','#8d5f46'],5)}${line([[8.18,5.69,6],[8.18,5.69,17],[8.18,5.98,17],[8.18,5.98,6]],'#344851',2)}</g>`;
  if(mode==='flow'){
   art+=line([[2.5,8.7,7],[2.5,6.2,7],[7.75,6.2,7],[7.75,3.65,6]],v.moves>v.capacity?'#df6b66':'#36e0ca',3.8,'8 5');
   art+=chip(2.6,8.7,23,'Docks',56)+chip(7.75,3.65,41,'Put-away',73);
  }
  if(v.projects.length){art+=ground(8.7,4.47,1.18,2.77,6,'#dca960','#b27d4b',1);for(let i=0;i<4;i++)art+=box(8.74,4.63+i*.65,.99,.13,5,['#f7d77a','#6a5850','#63504d'],5.7);
   if(mode==='build')art+=chip(9.25,5.7,45,'Work in progress',111);
  }else if(mode==='build')art+=chip(8.8,5.4,34,'No work queued',102);
  const info=mode==='flow'?gauge('Handling',v.moves,v.capacity,'moves/mo'):mode==='build'?(`<div class="d13-jobs">${v.projects.length?v.projects.map(item=>`<span><b>${safe(item.type)}</b> · ${num(item.remaining)}m left</span>`).join(''):'<span>No investment work is queued.</span>'}</div>`):gauge('Storage',v.occupied,v.spaces,'pallets');
  return `<figure class="d13-yard"><div class="d13-yard-title"><span class="d13-kicker">WAREHOUSE CUTAWAY</span><span class="d13-pill ${loadClass}">${loadName}</span></div>
  <svg viewBox="0 0 650 352" role="img" aria-label="Warehouse cutaway with ${v.racks} installed racking units, ${v.staff} staff and ${v.sections} building sections">
  <defs><linearGradient id="d13-sky" x2="0" y2="1"><stop stop-color="#263e52"/><stop offset="1" stop-color="#4b666a"/></linearGradient><pattern id="d13-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" stroke="#b4d9d1" fill="none" opacity=".12"/></pattern></defs>
  <rect width="650" height="352" fill="url(#d13-sky)"/><rect width="650" height="352" fill="url(#d13-grid)"/>
  <path d="M0 225Q97 152 172 207T345 193T650 173V352H0Z" fill="#2b4c4c" opacity=".53"/>${art}</svg>
  <figcaption class="d13-yard-caption"><div class="d13-layer-buttons" aria-label="Warehouse view">${Object.entries(modes).map(([key,label])=>`<button class="d13-mode" data-scene-mode="${key}" aria-pressed="${key===mode}">${label}</button>`).join('')}</div>${info}<div class="d13-metadata"><span><b>${num(v.racks)}</b> racking units</span><span><b>${num(v.staff)}</b> staff</span><span><b>${num(v.sections)}</b> sections</span>${v.automated?`<span><b>${num(v.automated)}</b> automated</span>`:''}</div></figcaption></figure>`;
 }
 function map(v){
  const region=Object.prototype.hasOwnProperty.call(pos,v.region)?v.region:'mid', selected=v.regions.find(r=>r.id===region);
  const count=(a,id)=>a.filter(s=>s.region===id).length;
  const mark=(r)=>{
   const [x,y]=pos[r.id], yours=count(v.player,r.id), rivals=count(v.rivals,r.id), on=region===r.id;
   const orbit=v.rivals.filter(s=>s.region===r.id).slice(0,5).map((s,i)=>`<circle cx="${x-18+i*9}" cy="${y+15}" r="3.6" fill="${themes[s.colour]}" stroke="#163548"/>`).join('');
   return `<g class="vt-map-pin d13-map-spot ${on?'chosen':''}" role="button" tabindex="0" data-region="${r.id}" aria-label="Show ${safe(r.name)}"><circle cx="${x}" cy="${y}" r="22" fill="${on?'#dda85e':'#658d90'}" opacity=".66" stroke="#ffe4a5" stroke-width="${on?2.5:1}"/><circle cx="${x}" cy="${y}" r="9" fill="${yours?'#7edbc3':'#233e50'}" stroke="#e9e4bf" stroke-width="1.6"/>${orbit}
    <text x="${x+31}" y="${y-5}" fill="#fff3dc" font-size="12" font-weight="750">${safe(r.name)}</text><text x="${x+31}" y="${y+9}" fill="#b7d1d4" font-size="9">${r.demand} tenders · ${rivals} rival sites</text></g>`;
  };
  const here=v.player.filter(s=>s.region===region), opponents=[...new Map(v.rivals.filter(s=>s.region===region).map(s=>[s.name,s])).values()];
  return `<section class="panel d13-network"><div class="d13-section-head"><div><span class="d13-kicker">REGIONAL VIEW</span><h2>UK network</h2></div><span class="d13-pill quiet">${v.regions.reduce((n,r)=>n+r.demand,0)} open tenders</span></div><div class="d13-map-layout"><div class="network-board">
  <svg viewBox="0 0 410 328" role="group" aria-label="UK regions with warehouse sites and open tenders"><defs><pattern id="d13-netgrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#83aaac" opacity=".21"/></pattern></defs><rect width="410" height="328" fill="#1c3446"/><rect width="410" height="328" fill="url(#d13-netgrid)"/><path d="${v.outline}" transform="translate(14 -4)" fill="#345b60" stroke="#7eabac" stroke-width="1.8" stroke-linejoin="round"/><path d="M159 113Q173 155 177 185T218 242" stroke="#e6b777" fill="none" stroke-width="2" stroke-dasharray="4 5"/>${v.regions.map(mark).join('')}<text x="14" y="320" fill="#b4cdd5" font-size="10">Indicative routes and locations</text></svg></div>
   <div class="d13-map-detail"><div class="d13-region-buttons">${v.regions.map(r=>`<button class="network-site vt-region" data-region="${r.id}" aria-pressed="${r.id===region}">${safe(r.id==='north'?'North':r.name)}</button>`).join('')}</div>
   <h3>${safe(selected.name)}</h3><p class="muted">${safe(selected.desc)}</p><p class="d13-region-totals"><b>${selected.demand}</b> open tenders <b>${here.length}</b> your sites <b>${count(v.rivals,region)}</b> rival sites</p>
   <div class="d13-region-sites">${here.map(s=>`<button class="network-site vt-site" data-index="${s.index}"><b>${safe(s.name)}</b><small>${num(s.moves)} / ${num(s.capacity)} pallet moves</small></button>`).join('')||'<span class="muted">No site of your own here yet.</span>'}</div>
   ${opponents.length?`<div class="d13-rivals"><span class="d13-kicker">OPERATORS</span>${opponents.map(s=>`<span><i style="--dot:${themes[s.colour]}"></i>${safe(s.name)}</span>`).join('')}</div>`:''}</div></div></section>`;
 }
 window.WTVisual={warehouse,map,status,gauge};
})();
