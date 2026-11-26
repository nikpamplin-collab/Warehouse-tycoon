/* DOTv17 warehouse facilities. Sim rules are separate from read-only views and input actions. */
(() => {
 'use strict';
 const DOCK = 'Dock door';
 const SPRINKLERS = 'Sprinklers';
 const MOVES_PER_DOOR = 4950; // 30/h, shared by receipt and despatch, × 165 h per staffed shift.
 const integer = new Intl.NumberFormat('en-GB', {maximumFractionDigits:0});
 const number = n => integer.format(n);
 const pounds = n => '£'+number(n);
 const whole = n => Number.isSafeInteger(n) && n >= 0 ? n : 0;
 const sectionCount = s => Math.max(1, whole(s?.sections));
 // Standard frontage starts with two dock-level bays and gains one per
 // extension. A suitable layout has room for one additional retrofit bay.
 // Preserve paid-for retrofits on old saves without letting them add more.
 const installedDoors = s => Math.min(sectionCount(s), whole(s?.facilityDocks));
 const doorCount = s => 1+sectionCount(s)+installedDoors(s);
 const retrofitLimit = s => s?.facilityFrontage===false?0:1;
 const dockCapacity = (s,shiftCount=1) => doorCount(s)*MOVES_PER_DOOR*shiftCount;
 const handlingCapacity = (s, workforceCapacity) => Math.min(dockCapacity(s), workforceCapacity);
 const sprinklerCover = s => DOT20Fire.footprint(s).roof>0;
 const runningCost = s => DOT20Fire.runningCost(s);
 const quote = (s, type) => {
  const projects = Array.isArray(s?.projects) ? s.projects : [];
  if (type === DOCK) {
   const queued = projects.filter(p => p.type === DOCK).length;
   return {queued, available:installedDoors(s)+queued < retrofitLimit(s), cost:28000, months:1};
  }
  return DOT20Fire.quote(s,type);
 };
 function complete(s, type, project) {
  if (type === DOCK) s.facilityDocks = Math.min(sectionCount(s), installedDoors(s)+1); // Honour paid orders already underway.
  DOT20Fire.complete(s,project);
 }
 const fireRisk = s => DOT20Fire.fireRisk(s);
 const incidentKind = (s,roll) => DOT20Fire.incidentKind(s,roll);
 const dockIcon = status => `<svg aria-hidden="true" viewBox="0 0 28 25" class="d17-facility-door d17-facility-${status}"><path d="M3 22V3h22v19M1 22h26M6 8h16M6 12h16M6 16h16M6 20h16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
 function strip(s) {
  if (!s) return '';
  const doors = doorCount(s), added = installedDoors(s), dockOrder = quote(s,DOCK);
  const art = [...Array.from({length:Math.min(6,1+sectionCount(s))},()=>dockIcon('base')), ...Array.from({length:Math.min(6,added)},()=>dockIcon('added')), ...(dockOrder.queued ? [dockIcon('queued')] : [])].join('');
  return `<section class="d17-facility-status" aria-label="Loading and fire protection">
   <div>${art}<strong>${number(doors)} working dock doors</strong><span>${number(dockCapacity(s,typeof dot19ShiftCount==='function'?dot19ShiftCount(s):1))} pallet movements/turn across staffed shifts${dockOrder.queued ? ' · '+dockOrder.queued+' in fit-out' : ''}</span></div>
   ${DOT20Fire.shortStatus(s)}
  </section>`;
 }
 function panel(s, cash) {
  if (!s) return '';
  const dock = quote(s, DOCK);
  const buy = (id, quote, label) => `<button class="btn secondary" ${!quote.available||cash<quote.cost?'disabled':''} onclick="orderWarehouseFacility('${id}')">${label} · ${pounds(quote.cost)}</button>`;
  return `<div class="panel d17-facilities"><h2 id="d17-facilities">Dock doors &amp; fire protection</h2>
   ${strip(s)}
   <div class="d17-facility-options">
    <section><h3>Loading dock</h3><p>The 25,000 sq ft starter has two dock-level bays. An extension adds one. Suitable frontage allows one extra retrofit bay after one turn. Each bay handles up to 30 pallets/hour across both directions, or ${number(MOVES_PER_DOOR)} per staffed shift per turn. Level-access doors are not counted as trailer bays.</p>
    ${buy('dock',dock,'Add dock door')}${!dock.available ? '<p class="muted">No spare dock frontage, or the retrofit is already fitted or in the queue.</p>' : ''}</section>
   </div>
   ${DOT20Fire.controls(s,cash)}
  </div>`;
 }
 window.DOT17Facilities = Object.freeze({DOCK, SPRINKLERS, doorCount, dockCapacity, handlingCapacity, installedDoors, sprinklerCover, runningCost, quote, complete, incidentKind, fireRisk, strip, panel});
})();
