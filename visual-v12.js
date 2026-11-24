/* Read-only presentation. All mutations still go through the original game controls. */
window.WTVisual = (() => {
 const accent=['#ffa9a0','#ffd17c','#bbadff','#76ddfa','#ff9cdd','#cadb8b'];
 const safe=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>Math.round(n).toLocaleString('en-GB');
 const clamp=(x,l,h)=>Math.max(l,Math.min(h,x));
 const svgMark=(x,y,colour,rad=9)=>`<g transform="translate(${x} ${y})"><circle r="${rad}" fill="${colour}" stroke="#0c2232" stroke-width="2"/><path d="M-4 3V-2L0-5 4-2V3H-4M-1.5 3V0H1.5V3" fill="none" stroke="#132a37" stroke-width="1.2"/></g>`;
 function map(v){
  const pos={north:[179,122],mid:[205,204],south:[251,265]};
  const selected=pos[v.region]?v.region:'mid';
  const pinRows=v.regions.map(r=>{
   const [x,y]=pos[r.id], own=v.player.filter(s=>s.region===r.id), rivals=v.rivals.filter(s=>s.region===r.id);
   const shown=rivals.slice(0,6);
   return `<g class="vt-map-pin" role="button" tabindex="0" data-region="${r.id}" aria-label="Show ${safe(r.name)}"><circle cx="${x}" cy="${y}" r="${24+Math.min(12,r.demand*2)}" fill="${selected===r.id?'#88ddbc':'#86ccfa'}" opacity=".20" stroke="#8be7ee" stroke-width="2"/>
   ${shown.map((s,i)=>svgMark(x-22+(i%3)*14,y+14+Math.floor(i/3)*15,accent[s.colour],7)).join('')}
   ${own.slice(0,3).map((s,i)=>svgMark(x+10+i*18,y-9,s.overload?'#ff8f8c':'#76ead2',10)).join('')}
   <text x="${x+30}" y="${y-23}" fill="#effaff" font-size="12" font-weight="700">${safe(r.name)}</text>
   <text x="${x+30}" y="${y-8}" fill="#a8d2e9" font-size="10">${r.demand} open ${r.demand===1?'tender':'tenders'}</text></g>`;
  }).join('');
  const region=v.regions.find(r=>r.id===selected), here=v.player.filter(s=>s.region===selected), others=v.rivals.filter(s=>s.region===selected);
  const names=others.map(s=>`<span><i style="--dot:${accent[s.colour]}"></i>${safe(s.name)}</span>`).join('');
  return `<section class="panel"><h2>UK network</h2><div class="network-layout"><div class="network-board">
  <svg viewBox="0 0 420 340" role="group" aria-label="UK regions, warehouse operators and current tender demand"><defs><pattern id="netGrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#507c9d" opacity=".2"/></pattern></defs>
  <rect width="420" height="340" fill="url(#netGrid)"/><path d="${v.outline}" transform="translate(31,-7)" fill="#386a72" stroke="#83bac3" stroke-width="2" stroke-linejoin="round"/>
  <path d="M179 122 Q219 150 205 204 T251 265" fill="none" stroke="#f9c776" stroke-width="3" stroke-dasharray="6 5" opacity=".75"/>
  ${pinRows}<text x="16" y="320" fill="#a8d2e9" font-size="10">Illustrative centres and links</text></svg></div>
  <div class="network-list">${v.regions.map(r=>`<button class="network-site vt-region" data-region="${r.id}" aria-pressed="${r.id===selected}"><b>${safe(r.name)}</b><small>${r.demand} open · ${v.player.filter(s=>s.region===r.id).length} your sites · ${v.rivals.filter(s=>s.region===r.id).length} rival sites</small></button>`).join('')}
  <div class="map-key"><span><i style="--dot:#76ead2"></i>Your site</span><span><i style="--dot:#ff8f8c"></i>Overloaded</span>${names}</div>
  ${here.map(s=>`<button class="network-site vt-site" data-index="${s.index}"><b>${safe(s.name)}</b><small>${fmt(s.moves)} / ${fmt(s.capacity)} pallet moves</small></button>`).join('')||'<p class="muted">No site of your own here.</p>'}
  <small class="muted">${safe(region.desc)}</small></div></div></section>`;
 }
 function warehouse(v){
  const p=(x,y,z=0)=>[290+(x-y)*22,61+(x+y)*10-z];
  const pt=(x,y,z)=>p(x,y,z).join(',');
  const poly=(points,fill,stroke='#213b49')=>`<polygon points="${points.map(a=>pt(...a)).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="1.25"/>`;
  function box(x,y,w,d,h,colors){
   return poly([[x,y,h],[x+w,y,h],[x+w,y+d,h],[x,y+d,h]],colors[0])+poly([[x,y+d,h],[x+w,y+d,h],[x+w,y+d,0],[x,y+d,0]],colors[1])+poly([[x+w,y,h],[x+w,y+d,h],[x+w,y+d,0],[x+w,y,0]],colors[2]);
  }
  let art=poly([[-1,-1,0],[11,-1,0],[11,11,0],[-1,11,0]],'#4a6473')+
   box(0,0,9,8,6,['#93aab1','#556d80','#334953'])+
   poly([[0,0,4],[9,0,4],[9,8,4],[0,8,4]],'#c9b78f')+
   poly([[0,0,4],[9,0,4],[9,0,53],[0,0,53]],'#7eaac5')+
   poly([[0,0,4],[0,8,4],[0,8,43],[0,0,53]],'#a4c7d5');
  for(let i=1;i<9;i++)art+=`<path d="M${pt(i,0,5)}L${pt(i,8,5)}" stroke="#776f64" opacity=".3"/>`;
  for(let i=1;i<8;i++)art+=`<path d="M${pt(0,i,5)}L${pt(9,i,5)}" stroke="#776f64" opacity=".3"/>`;
  for (let i=0;i<4;i++) art+=poly([[i*2+.38,0,29],[i*2+1.55,0,29],[i*2+1.55,0,43],[i*2+.38,0,43]],'#dff7fb','#42667a');
  let maxRows=clamp(v.sections*9,1,36), count=Math.min(18,Math.ceil((v.racks/Math.max(1,maxRows))*18));
  let occupied=Math.ceil(count*clamp(v.occupied/Math.max(1,v.spaces),0,1));
  const bays=[];for(let y of [1,2.7,4.4])for(let x=1;x<=6;x++)bays.push([x*1.02,y]);
  for(let i=0;i<bays.length;i++){
   const [x,y]=bays[i];
   if(i<count){art+=box(x,y,.8,.64,27,['#51748a','#da924d','#415664']);
    art+=poly([[x+.07,y+.66,21],[x+.73,y+.66,21],[x+.73,y+.66,9],[x+.07,y+.66,9]],i<occupied?'#f6bf61':'#294652');
    if(i<occupied)art+=poly([[x+.09,y+.68,20],[x+.5,y+.68,20],[x+.5,y+.68,10],[x+.09,y+.68,10]],'#e59545');
   }
  }
  if(v.occupied>0&&count===0)art+=box(2,5.25,.85,.65,13,['#fbd286','#ce8c4a','#885a39']);
  if(v.automated)art+=box(7.5,2,.95,2.4,28,['#78f9df','#357d91','#224e63']);
  const workerCount=Math.min(4,Math.ceil(v.staff/3));
  for(let i=0;i<workerCount;i++){const [x,y]=p(1.2+i*1.6,6.3,11);art+=`<g><ellipse cx="${x}" cy="${y+10}" rx="5" ry="2" fill="#1e384c" opacity=".35"/><path d="M${x-3} ${y+6}v-7q3-5 6 0v7" fill="#ffad5d" stroke="#294351"/><circle cx="${x}" cy="${y-5}" r="3" fill="#fde7a4"/></g>`;}
  const dock=(x)=>box(x,8,.9,.45,17,['#ededd8','#344a56','#69848c']);
  art+=dock(2)+dock(4.5)+dock(7);
  if(v.moves>0){art+=box(2.2,8.8,1.1,1.6,17,['#f0eee0','#d3d8d8','#90a5a4'])+box(2.2,10.45,1.1,.64,11,['#87dbc8','#4b9caa','#337284']);}
  if(v.staff&&v.moves){art+=`<g class="scene-load">${box(6.1,6.5,.65,.52,9,['#ffd35e','#d49146','#a05935'])}</g>`;}
  if(v.projects.length){art+=poly([[7.2,4.8,5],[8.7,4.8,5],[8.7,7.4,5],[7.2,7.4,5]],'#d89248');for(let i=0;i<3;i++)art+=box(7.25,5+i*.75,1.35,.15,6,['#f8de8c','#343f4a','#343f4a']);}
  return `<figure class="scene-v12"><svg viewBox="0 0 580 321" role="img" aria-label="Warehouse cutaway with ${v.racks} installed racking units and ${v.staff} staff"><defs><linearGradient id="yardSky"><stop stop-color="#285d83"/><stop offset="1" stop-color="#6ca5b4"/></linearGradient></defs><rect width="580" height="321" fill="url(#yardSky)"/>
  <path d="M0 168Q130 97 239 146T580 118V321H0Z" fill="#537b79" opacity=".66"/>${art}
  ${v.moves>v.capacity?'<rect x="14" y="14" rx="7" width="125" height="25" fill="#ab4055"/><text x="24" y="31" fill="white" font-size="12">Handling overloaded</text>':''}</svg>
  <figcaption class="scene-data"><span><b>${fmt(v.racks)}</b> racking units</span><span><b>${fmt(v.occupied)} / ${fmt(v.spaces)}</b> pallet spaces committed</span><span><b>${fmt(v.staff)}</b> staff</span>${v.projects.map(x=>`<span>${safe(x.type)} · ${x.remaining}m</span>`).join('')}</figcaption></figure>`;
 }
 return { map,warehouse };
})();
