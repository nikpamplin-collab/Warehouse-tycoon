/* DOTv16 read-only presentation. No game-state references, transitions or mutations. */
(() => {
  'use strict';
  const safe = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const finite = Number.isFinite;
  const pounds = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0, minimumFractionDigits: 0 });
  const integer = new Intl.NumberFormat('en-GB', {maximumFractionDigits: 0});
  const money = value => finite(value) ? pounds.format(Math.round(value) || 0) : 'Not recorded';
  const operatingKeys = ['rent', 'labour', 'hs', 'incidentCost', 'overflowCost', 'management'];
  const total = (record, keys) => keys.every(k => finite(record?.[k])) ? keys.reduce((sum, k) => sum + record[k], 0) : undefined;
  const revenue = r => total(r, ['storage', 'handling']);
  const operating = r => { const base=total(r,operatingKeys);return finite(base)?base+(r.facilityCost||0)+(r.mheCost||0)+(r.stockControlCost||0)+(r.stockFines||0):undefined; };
  const titleOf = r => r?.label || (finite(r?.month) ? 'Month ' + r.month : 'Completed month');
  function ordered(vm) {
    const records = Array.isArray(vm.history) ? vm.history.filter(r => r && typeof r === 'object') : [];
    const last = vm.last || records.at(-1);
    const sameMonth = (a, b) => a === b || (finite(a?.month) && a.month === b?.month);
    const trend = last ? [...records.filter(r => !sameMonth(r, last)), last].slice(-6) : [];
    const previous = trend.at(-2);
    return {last, trend, previous};
  }
  function movement(value, earlier, expense = false) {
    if (!finite(value) || !finite(earlier)) return '';
    const change = Math.round(value - earlier);
    const tone = change === 0 ? 'quiet' : ((change > 0) !== expense ? 'good' : 'bad');
    return `<span class="d16-change d16-${tone}">${change === 0 ? 'No change' : `${change > 0 ? '+' : '−'}${money(Math.abs(change))}`} <span>vs previous month</span></span>`;
  }
  function stat(label, value, details = '', tone = '') {
    return `<div class="d16-stat ${tone ? 'd16-'+tone : ''}"><dt>${safe(label)}</dt><dd>${money(value)}${details}</dd></div>`;
  }
  function sparkline(records, read, label) {
    const plotted = records.map((r, index) => ({amount:read(r), index})).filter(p => finite(p.amount));
    if (!plotted.length) return '';
    const lo = Math.min(0, ...plotted.map(p => p.amount)), hi = Math.max(0, ...plotted.map(p => p.amount));
    const y = n => (35 - (n - lo) / (hi - lo || 1) * 29).toFixed(1);
    const x = n => records.length === 1 ? 96 : (6 + n * 180 / (records.length - 1)).toFixed(1);
    const end = plotted.at(-1);
    const segments = [];
    for (const point of plotted) {
      if (!segments.length || segments.at(-1).at(-1).index !== point.index - 1) segments.push([]);
      segments.at(-1).push(point);
    }
    const summary = records.map(r => titleOf(r) + ': ' + money(read(r))).join('; ');
    return `<figure class="d16-chart"><figcaption>${safe(label)}</figcaption><svg viewBox="0 0 192 41" role="img" aria-label="${safe(label + ' by month. ' + summary)}">
      <line class="d16-zero" x1="6" x2="186" y1="${y(0)}" y2="${y(0)}"/>
      ${segments.map(s => s.length === 1 ? `<circle cx="${x(s[0].index)}" cy="${y(s[0].amount)}" r="2.5"/>` : `<polyline points="${s.map(p => x(p.index)+','+y(p.amount)).join(' ')}"/>`).join('')}
      ${segments.at(-1).length > 1 ? `<circle cx="${x(end.index)}" cy="${y(end.amount)}" r="3"/>` : ''}
    </svg></figure>`;
  }
  const types = {
    incident: ['!', 'Safety incident', 'bad'],
    stock: ['!', 'Stock shortage', 'bad'],
    market: ['↕', 'Market outlook', 'watch'],
    shock: ['!', 'Market shock', 'bad'],
    competitor: ['↗', 'Competition', 'watch'],
    win: ['✓', 'Contract won', 'good'],
    award: ['◆', 'Tender awarded', 'quiet'],
    tender: ['◇', 'Tender result', 'quiet'],
    project: ['⬡', 'Project update', 'quiet'],
    completed: ['✓', 'Project complete', 'good'],
    milestone: ['★', 'Milestone', 'good'],
    acquisition: ['◆', 'Acquisition', 'quiet'],
    update: ['·', 'Network update', 'quiet']
  };
  function classify(message, playerName = '') {
    if (/^STOCK SHORTAGE:/i.test(message)) return 'stock';
    if (/^ECONOMY:/i.test(message)) return 'market';
    if (/^MARKET SHOCK:/i.test(message)) return 'shock';
    if (/^(NEW ENTRANT|Competitor update):/i.test(message)) return 'competitor';
    if (/^(Milestone|OBJECTIVE ACHIEVED):/i.test(message)) return 'milestone';
    if (/^(ACQUISITION|TAKEOVER COMPLETE|CONTROL):/i.test(message)) return 'acquisition';
    if (/\b(?:installation(?:s)?|CI) completed\b/i.test(message)) return 'completed';
    if (/^Cancelled (?:Racking|Expansion|Automation|CI|Dock door|Sprinklers) project\b|:\s+(?:Racking|Expansion|Automation|Replacement|CI|Dock door|Sprinklers) \d+ months? remaining\.$/i.test(message)) return 'project';
    if (/:\s*(?:no suitable bids|customers rejected bids above market budget)\.$/i.test(message)) return 'tender';
    if (/\bwon \([^)]+\/month forecast\)\.$/i.test(message)) {
      return playerName && message.includes(': ' + playerName + ' won (') ? 'win' : 'award';
    }
    return 'update';
  }
  function dispatchEvents(vm, last) {
    const seen = new Set(), entries = [];
    const add = (message, category) => {
      if (typeof message !== 'string' || !message.trim() || seen.has(message)) return;
      seen.add(message);
      entries.push([message, category || classify(message, vm.playerName)]);
    };
    for (const message of Array.isArray(vm.events) ? vm.events : []) add(message);
    const incidents = Array.isArray(last?.incidents) ? last.incidents : [];
    for (const incident of incidents) {
      if (!incident || typeof incident !== 'object') continue;
      let message = `${incident.site || 'Warehouse'}: ${incident.kind==='Fire'?'FIRE INCIDENT':(incident.severity || 'Recorded')+' incident'} in ${titleOf(last)}.`;
      if (finite(incident.cost)) message += ' Cost: '+money(incident.cost)+'.';
      if (finite(incident.netMissed)) message += ' Moves missed: '+integer.format(incident.netMissed)+'.';
      add(message, 'incident');
    }
    for (const message of Array.isArray(vm.log) ? vm.log : []) {
      // The persistent log contains low-signal tender results; show only actual material updates.
      if (typeof message !== 'string') continue;
      const category = classify(message, vm.playerName);
      if (category !== 'update' && category !== 'tender' && category !== 'award') add(message, category);
    }
    return entries.slice(0, 8);
  }
  function dispatchFeed(vm, last) {
    const events = dispatchEvents(vm, last);
    const list = rows => `<ul class="d16-feed">${rows.map(([message, category]) => {
      const [icon, label, tone] = types[category];
      return `<li class="d16-${tone}"><span class="d16-badge"><span aria-hidden="true">${icon}</span> ${label}</span><p>${safe(message)}</p></li>`;
    }).join('')}</ul>`;
    return `<div class="d16-news"><h3>Dispatch board</h3>${events.length
      ? `<p class="d16-note">Latest available operations and market updates.</p>${list(events.slice(0,4))}${events.length > 4 ? `<details><summary>More recorded updates</summary>${list(events.slice(4))}</details>` : ''}`
      : '<p class="d16-note">No updates recorded yet. Advance a month to open the dispatch board.</p>'}</div>`;
  }
  function chartPair(trend) {
    const figures = sparkline(trend, revenue, 'Revenue') + sparkline(trend, r => r.profit, 'Profit / loss');
    return figures ? `<div class="d16-trends"><p class="d16-note">Last ${trend.length} completed ${trend.length === 1 ? 'month' : 'months'} · each chart scales separately</p><div>${figures}</div></div>` : '';
  }
  function renderDispatch(vm = {}) {
    const {last, previous, trend} = ordered(vm);
    const cashNote = finite(vm.cash) && vm.cash < 0 ? '<span class="d16-change d16-bad">Cash below zero</span>' : '';
    return `<div class="d16-dispatch"><dl class="d16-stats">
      ${stat('Cash on hand', vm.cash, cashNote, cashNote ? 'bad' : '')}
      ${stat('Estimated company value', vm.valuation)}
      ${last ? stat('Last month’s revenue', revenue(last),movement(revenue(last),revenue(previous))) + stat('Last month’s profit / loss',last.profit,movement(last.profit,previous?.profit),last.profit < 0 ? 'bad' : '') : ''}
    </dl>${last ? chartPair(trend) : '<p class="d16-note">Complete your first month to see the trading results.</p>'}${dispatchFeed(vm,last)}</div>`;
  }
  function financeRow(label, amount, details = '') {
    return `<div><dt>${safe(label)}</dt><dd>${money(amount)}${details}</dd></div>`;
  }
  function historyTable(records) {
    return `<details class="d16-history"><summary>Trend data by month</summary><table><thead><tr><th scope="col">Month</th><th scope="col">Revenue</th><th scope="col">Profit / loss</th></tr></thead><tbody>
      ${records.map(r => `<tr><th scope="row">${safe(titleOf(r))}</th><td>${money(revenue(r))}</td><td>${money(r.profit)}</td></tr>`).join('')}
    </tbody></table></details>`;
  }
  function renderFinance(vm = {}) {
    const {last, previous, trend} = ordered(vm);
    const open = vm.openCapitalOrders;
    const hasOpen = open && Number.isInteger(open.count) && open.count > 0 && finite(open.cost) && open.cost >= 0;
    return `<section class="panel d16-finance"><span class="d13-kicker">FINANCE DESK</span><h2>Trading &amp; cash</h2>
      ${last ? `<p class="d16-note">Completed month: <b>${safe(titleOf(last))}</b></p>
      <dl class="d16-stats">${stat('Trading revenue',revenue(last),movement(revenue(last),revenue(previous)))}${stat('Profit / loss after interest',last.profit,movement(last.profit,previous?.profit),last.profit < 0?'bad':'')}${stat('Cash on hand now',vm.cash,'',vm.cash < 0?'bad':'')}</dl>
      <div class="d16-breakdown"><dl><div><dt>Recorded operating costs (OpEx)</dt><dd>${money(operating(last))}${movement(operating(last),operating(previous),true)}</dd></div>
      ${finite(last.mheCost) ? financeRow('Equipment leases',last.mheCost)+financeRow('Stock control management',last.stockControlCost)+financeRow('Stock shortage charges',last.stockFines) : ''}${financeRow('Interest charged',last.interest)}${financeRow('Loan principal repaid',last.principal)}${financeRow('Cash at monthly close',last.cash)}</dl>
      <p class="d16-note">OpEx includes warehouse overhead, labour, safety, incidents, overflow, inspections, management, equipment leases and stock control costs. Interest affects profit; principal repayments affect cash only. Current cash can change after the monthly close.</p>
      </div>${chartPair(trend)}${historyTable(trend)}` : `<dl class="d16-stats">${stat('Cash on hand now',vm.cash,'',vm.cash < 0?'bad':'')}</dl><p class="d16-note">Complete the first month to compare trading revenue, profit and costs.</p>`}
      <div class="d16-investment"><h3>Capital projects</h3>${hasOpen ? `<dl>${financeRow('Recorded cost of open capital projects',open.cost)}</dl><p class="d16-note">${open.count} open ${open.count === 1 ? 'project' : 'projects'} still in progress. This is not a cash movement for the month. It excludes completed projects and other asset purchases.</p>` : ''}
      <p class="d16-note">The game does not track total capital expenditure (CapEx) by month.</p></div>
    </section>`;
  }
  window.WTVisualV16 = Object.freeze({renderDispatch, renderFinance});
})();
