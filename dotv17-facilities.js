/* DOTv17 warehouse facilities. Sim rules are separate from read-only views and input actions. */
(() => {
 'use strict';
 const DOCK = 'Dock door';
 const SPRINKLERS = 'Sprinklers';
 const MOVES_PER_DOOR = 4950; // 30/h, shared by receipt and despatch, × 165 h per staffed shift.
 const FIRE_SHARE = .12;
 const FIRE_RISK_REDUCTION = .8;
 const SPRINKLER_INSPECTION = 120;
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
 const sprinklerCover = s => s?.facilitySprinklers === true;
 const runningCost = s => sprinklerCover(s) ? SPRINKLER_INSPECTION*sectionCount(s) : 0;
 const quote = (s, type) => {
  const projects = Array.isArray(s?.projects) ? s.projects : [];
  if (type === DOCK) {
   const queued = projects.filter(p => p.type === DOCK).length;
   return {queued, available:installedDoors(s)+queued < retrofitLimit(s), cost:28000, months:1};
  }
  if (type === SPRINKLERS) {
   const queued = projects.some(p => p.type === SPRINKLERS) ? 1 : 0;
   return {queued, available:!sprinklerCover(s) && !queued, cost:18000+6000*(sectionCount(s)-1), months:2};
  }
  return null;
 };
 function complete(s, type) {
  if (type === DOCK) s.facilityDocks = Math.min(sectionCount(s), installedDoors(s)+1); // Honour paid orders already underway.
  if (type === SPRINKLERS) s.facilitySprinklers = true;
 }
 const hsRisk = s => s?.hs ? .1 : .4;
 const fireRisk = s => hsRisk(s)*FIRE_SHARE*(sprinklerCover(s) ? 1-FIRE_RISK_REDUCTION : 1);
 const riskText = risk => (risk*100).toLocaleString('en-GB',{maximumFractionDigits:2})+'%';
 // Fire occupies a subset of the existing H&S window. A prevented fire does not become another incident.
 function incidentKind(s, roll) {
  const originalFireRisk = hsRisk(s)*FIRE_SHARE;
  if (roll < originalFireRisk) return roll < fireRisk(s) ? 'Fire' : null;
  if (roll < hsRisk(s)) return 'Safety';
  return null;
 }
 const dockIcon = status => `<svg aria-hidden="true" viewBox="0 0 28 25" class="d17-facility-door d17-facility-${status}"><path d="M3 22V3h22v19M1 22h26M6 8h16M6 12h16M6 16h16M6 20h16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
 const waterIcon = `<svg aria-hidden="true" viewBox="0 0 28 28" class="d17-facility-water"><path d="M3 5h22M14 5v7m-4 1h8m-4 4v6m-5-6-3 4m13-4 3 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
 function strip(s) {
  if (!s) return '';
  const doors = doorCount(s), added = installedDoors(s), dockOrder = quote(s,DOCK), sprinkleOrder = quote(s,SPRINKLERS);
  const fire = s.last?.incident?.kind === 'Fire';
  const art = [...Array.from({length:Math.min(6,1+sectionCount(s))},()=>dockIcon('base')), ...Array.from({length:Math.min(6,added)},()=>dockIcon('added')), ...(dockOrder.queued ? [dockIcon('queued')] : [])].join('');
  return `<section class="d17-facility-status" aria-label="Loading and fire protection">
   <div>${art}<strong>${number(doors)} working dock doors</strong><span>${number(dockCapacity(s,typeof dot19ShiftCount==='function'?dot19ShiftCount(s):1))} pallet movements/turn across staffed shifts${dockOrder.queued ? ' · '+dockOrder.queued+' in fit-out' : ''}</span></div>
   <div class="${sprinklerCover(s) ? 'd17-facility-added' : ''}">${waterIcon}<strong>${sprinklerCover(s) ? 'Sprinklers commissioned' : sprinkleOrder.queued ? 'Sprinklers in fit-out' : 'No sprinklers fitted'}</strong><span>${riskText(fireRisk(s))} monthly fire risk with current H&amp;S cover${fire ? ' · Fire incident last month' : ''}</span></div>
  </section>`;
 }
 function panel(s, cash) {
  if (!s) return '';
  const dock = quote(s, DOCK), sprinklers = quote(s, SPRINKLERS);
  const buy = (id, quote, label) => `<button class="btn secondary" ${!quote.available||cash<quote.cost?'disabled':''} onclick="orderWarehouseFacility('${id}')">${label} · ${pounds(quote.cost)}</button>`;
  return `<div class="panel d17-facilities"><h2 id="d17-facilities">Dock doors &amp; fire protection</h2>
   ${strip(s)}
   <div class="d17-facility-options">
    <section><h3>Loading dock</h3><p>The 25,000 sq ft starter has two dock-level bays. An extension adds one. Suitable frontage allows one extra retrofit bay after one turn. Each bay handles up to 30 pallets/hour across both directions, or ${number(MOVES_PER_DOOR)} per staffed shift per turn. Level-access doors are not counted as trailer bays.</p>
    ${buy('dock',dock,'Add dock door')}${!dock.available ? '<p class="muted">No spare dock frontage, or the retrofit is already fitted or in the queue.</p>' : ''}</section>
    <section><h3>Sprinklers</h3><p>Cut fire risk by 80% without changing other safety incidents. Two months to commission. Inspections cost ${pounds(runningCost(s) || SPRINKLER_INSPECTION*sectionCount(s))}/month at this footprint (${pounds(SPRINKLER_INSPECTION)} per section). New extensions link into the fitted system.</p>
    ${buy('sprinklers',sprinklers,'Retrofit sprinklers')}</section>
   </div>
  </div>`;
 }
 window.DOT17Facilities = Object.freeze({DOCK, SPRINKLERS, doorCount, dockCapacity, handlingCapacity, installedDoors, sprinklerCover, runningCost, quote, complete, incidentKind, fireRisk, strip, panel});
})();
