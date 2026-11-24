/* DOTv14 presentation. State is read only through view models created by index.html. */
(() => {
 'use strict';
 const colours=['#f6a082','#a8dd97','#a6bcff','#f1c876','#d3a5ed','#7edac5'];
 const glyphs=['M4 15l5-10 5 10M6 12h6','M4 9l5-5 5 5-5 5Z','M4 14V5l10 9V5','M5 5h8v8H5zM8 8h2v2H8','M4 6h10M4 10h7M4 14h4','M4 12l5-7 5 7M4 15l5-5 5 5'];
 const places={north:{x:154,y:110,label:'North',road:'M62 51Q112 68 154 110'},mid:{x:167,y:183,label:'Midlands',road:'M44 202Q102 166 167 183'},south:{x:213,y:249,label:'South East',road:'M213 249Q263 236 304 273'}};
 const corridors=[['north','mid','M154 110Q184 142 167 183'],['mid','south','M167 183Q190 196 213 249']];
 const trustedId=id=>Object.prototype.hasOwnProperty.call(places,id);
 const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const n=x=>Number.isFinite(x)?x:0, fmt=x=>Math.round(n(x)).toLocaleString('en-GB');
 const cash=x=>`${x<0?'−':''}£${fmt(Math.abs(x))}`;
 const colour=i=>Math.abs(Math.trunc(n(i)))%colours.length;
 const sum=(a,fn)=>a.reduce((t,x)=>t+n(fn(x)),0);
 const name=s=>s.owner||s.name;
 const scale=s=>Math.min(7,3+Math.sqrt(Math.max(0,n(s.space)))/32);
 const byRegion=(a,id)=>a.filter(s=>s.region===id);
 const badge=(i)=>`<svg class="d14-badge" viewBox="0 0 18 18" width="24" height="24" aria-hidden="true" style="--d14-brand:${colours[colour(i)]}"><rect x="1" y="1" width="16" height="16" rx="4"/><path d="${glyphs[colour(i)]}"/></svg>`;
 const heading=(k,title)=>`<div><span class="d14-eyebrow">${k}</span><h2>${title}</h2></div>`;

 function map(v){
  const regions=v.regions.filter(r=>trustedId(r.id));
  const region=regions.find(r=>r.id===v.region)||regions[0];
  if(!region)return '';
  const players=byRegion(v.player,region.id), rivals=byRegion(v.rivals,region.id);
  const all=[...v.player,...v.rivals];
  const moves=id=>sum(byRegion(all,id),s=>s.moves);
  const addStatuses=sites=>({load:sites.filter(s=>s.overload).length,build:sites.filter(s=>s.build>0).length});
  const regionName=id=>regions.find(r=>r.id===id)?.name||places[id].label;
  const roads=corridors.filter(([from,to])=>regions.some(r=>r.id===from)&&regions.some(r=>r.id===to));
  const roadMarkup=roads.map(([from,to,d])=>{
   const weight=2+Math.min(6,Math.sqrt(Math.max(0,moves(from)+moves(to))/9000));
   const dest=region.id===to?from:to;
   return `<path class="d14-road-outline" d="${d}" stroke-width="${weight+4}"/><path class="d14-road ${region.id===from||region.id===to?'chosen':''}" d="${d}" stroke-width="${weight}"/><path class="d14-road-mark" d="${d}"/><path class="vt-region d14-road-hit" data-region="${dest}" d="${d}"><title>Show ${safe(regionName(dest))}</title></path>`;
  }).join('');
  const pins=regions.map(r=>{
   const {x,y}=places[r.id], ps=byRegion(v.player,r.id), rs=byRegion(v.rivals,r.id);
   const sites=[...ps.map(s=>({...s,player:true})),...rs];
   const display=sites.slice(0,9);
   return `<circle class="d14-catchment" cx="${x}" cy="${y}" r="${30+Math.min(16,Math.sqrt(Math.max(0,n(r.demand)))*5)}"/>`+display.map((s,i)=>{
    const angle=-Math.PI*.83+i*(Math.PI*1.8/Math.max(1,display.length-1));
    const px=x+35*Math.cos(angle),py=y+35*Math.sin(angle);
    return `<g><circle cx="${px}" cy="${py}" r="${scale(s)}" fill="${s.player?'#69f0d0':colours[colour(s.colour)]}" stroke="${s.overload?'#fff0ac':'#071f28'}" stroke-width="${s.overload?2.4:1.35}"><title>${safe(s.player?s.name:name(s))}${s.overload?' · Above handling capacity':''}</title></circle>${s.build>0?`<path class="d14-map-build" d="M${px+3} ${py-8}l5 8h-10z"/>`:''}</g>`;
   }).join('');
  }).join('');
  const routeButtons=roads.filter(([from,to])=>region.id===from||region.id===to).map(([from,to])=>{
   const id=region.id===from?to:from;
   return `<button type="button" class="vt-region d14-route" data-region="${id}"><span aria-hidden="true">↗</span><span>Via <b>${safe(regionName(id))}</b></span><span>${fmt(moves(id))} moves</span></button>`;
  }).join('');
  const state=addStatuses([...players,...rivals]);
  const operators=[...new Map(rivals.map(s=>[name(s),s])).values()];
  return `<section class="panel d14-network" aria-label="UK network"><div class="d14-title">${heading('NETWORK CONTROL','UK logistics network')}<span class="d14-tag"><i></i>${fmt(sum(regions,r=>r.demand))} open tenders</span></div>
  <div class="d14-layout"><div class="d14-atlas"><div class="d14-map"><svg viewBox="0 0 320 324" aria-hidden="true"><defs><pattern id="d14-grid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="#7ca7ad" stroke-width=".65" opacity=".18"/></pattern><pattern id="d14-land" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6L6 0" stroke="#7cc3b5" opacity=".16"/></pattern></defs><path d="M0 0h320v324H0z" fill="url(#d14-grid)"/><path class="d14-land" d="${safe(v.outline)}"/><path d="${safe(v.outline)}" fill="url(#d14-land)"/><path d="M38 65v42m-16-21h32M35 71l3-6 3 6" stroke="#9abdc5" fill="none"/><text x="38" y="57" text-anchor="middle" fill="#c5d9d9" font-size="10">N</text><text x="24" y="273" fill="#93aeb4" font-size="8" letter-spacing="2">IRISH SEA</text><text x="233" y="120" fill="#93aeb4" font-size="8" letter-spacing="2">NORTH SEA</text>${regions.map(r=>`<path class="d14-local" d="${places[r.id].road}"/>`).join('')}${roadMarkup}${pins}</svg>
   ${regions.map(r=>{const {x,y,label}=places[r.id];return `<button type="button" class="vt-region d14-point" style="--d14-x:${x/3.2}%;--d14-y:${100*y/324}%" data-region="${r.id}" aria-pressed="${region.id===r.id}" aria-label="Show ${safe(r.name)}, ${fmt(r.demand)} tenders"><i aria-hidden="true"></i>${safe(label)}<b>${fmt(r.demand)}</b></button>`;}).join('')}
   </div><div class="d14-legend"><span><i></i>Your sites</span><span><i></i>Rival sites</span><span><i></i>Above capacity</span><span><i></i>Work underway</span></div><p class="d14-map-caption">Tender counts are shown on region markers. Site dots show pallet-space scale, up to nine per market.</p></div>
   <div class="d14-region"><span class="d14-eyebrow d14-region-label">SELECTED MARKET</span><h3>${safe(region.name)}</h3><p>${safe(region.desc)}</p>
   <div class="d14-stats"><div><b>${fmt(region.demand)}</b><span>Open tenders</span></div><div><b>${players.length}</b><span>Your sites</span></div><div><b>${rivals.length}</b><span>Rival sites</span></div></div>
   ${state.load||state.build?`<div class="d14-flags">${state.load?`<span>${state.load} above handling capacity</span>`:''}${state.build?`<span>Work underway at ${state.build}</span>`:''}</div>`:''}
   <div class="d14-sites">${players.map(s=>`<button type="button" class="network-site vt-site" data-index="${Math.max(0,Math.trunc(n(s.index)))}"><b>${safe(s.name)}</b><small>${fmt(s.moves)} / ${fmt(s.capacity)} pallet moves (forecast / capacity)</small></button>`).join('')}</div>
   ${operators.length?`<div class="d14-operators">${operators.map(s=>`<span title="${safe(name(s))}">${badge(s.colour)}${safe(name(s))}</span>`).join('')}</div>`:''}
   ${routeButtons?`<div class="d14-corridors"><span class="d14-eyebrow">NEIGHBOURING MARKETS</span>${routeButtons}<small>Link width shows combined regional forecast activity, not tracked shipments.</small></div>`:''}</div></div></section>`;
 }

 function rivalOverview({rivals,regions}){
  const regional=id=>regions.find(r=>r.id===id)?.name||id;
  const total=sum(rivals.filter(r=>!r.bankrupt),r=>sum(r.sites,s=>s.space));
  return `<section class="panel d14-rival-overview" aria-label="Rival operator directory"><div class="d14-title">${heading('COMPETITOR WATCH','Rival operators')}<span class="d14-tag"><i></i>${rivals.filter(r=>!r.bankrupt).length} trading</span></div>
   <div class="d14-rival-grid">${rivals.map(r=>{
    const book=sum(r.sites,s=>s.space), share=total&& !r.bankrupt?Math.round(book/total*100):null;
    const profit=r.profit??r.openingProfit;
    const badges=[...new Set(r.sites.map(s=>s.region))].map(id=>`<span>${safe(regional(id))} · ${byRegion(r.sites,id).length}</span>`).join('');
    return `<article class="d14-firm" style="--d14-brand:${colours[colour(r.colour)]}"><div class="d14-firm-head">${badge(r.colour)}<div><h3>${safe(r.name)}</h3><span>${r.bankrupt?'No longer trading':safe(r.strategy||'Balanced operator')}</span></div></div>
    <div class="d14-operator-kpis"><div><b>${r.sites.length}</b><span>Sites</span></div><div><b>${fmt(book)}</b><span>Pallet spaces</span></div>${Number.isFinite(profit)?`<div><b>${cash(profit)}</b><span>${r.profit==null?'Opening forecast':'Latest monthly profit'}</span></div>`:''}</div>
    ${share!=null?`<div class="d14-share"><span>${share}% of rival pallet capacity</span><div aria-hidden="true"><i style="--d14-share:${share}%"></i></div></div>`:''}
    <div class="d14-firm-regions">${badges}${r.sites.some(s=>s.build>0)?'<span>Work underway</span>':''}</div></article>`;
   }).join('')}</div></section>`;
 }
 Object.assign(window.WTVisual,{map,rivalOverview});
})();
