WAREHOUSE TYCOON | DOTv16 development candidate

DOTv13 changes how the game looks, not how it runs its businesses.
The live version stays where it is until this branch is reviewed and merged.

- Office opens with a warehouse cutaway and a dispatch brief.
- Floor, Pallet flow and Build queue layers use the actual site state.
- Warehouse size, racking, staff, working stock, automation and investments
  determine what the cutaway shows. Props and routes are illustrative.
- The UK map shows current tenders, sites and operators by region.
- Touch controls, keyboard focus and reduced-motion preferences are supported.
- v12 economics, six rival profiles, Protect rules and save key are unchanged.
- The desktop/static game needs no dependencies or build step.

Checks:
  node --test tests/regression.mjs
  WT_V12_FOLDER=/path/to/v12 node --test tests/regression.mjs

With the exact v12 fixture the suite compares complete game states through
16 seed-matched runs of 72 months and exercises a real v12 save in the JS
test harness. The targeted suite checks screens, map and layer actions,
investment, turn advance, reload and service-worker cache behavior.

Browser tests (separate from the game):
  npm install --ignore-scripts --no-audit --no-fund --no-save playwright@1.62.1
  npx playwright install chromium webkit
  WT_V12_FOLDER=/path/to/v12 node tests/browser.mjs

The browser test serves both v12 and DOTv13 at the same local origin using
a disposable save. Desktop Chromium and an emulated WebKit iPhone profile
do not replace a quick real iPhone Safari play-through before release.

DOTv14 adds route activity based on regional forecasts, warehouse-size and
status markers, and branded rival cards with site and capacity information.
Map links are illustrative and do not portray tracked shipments.

DOTv15 makes warehouse flow and construction visible from existing forecasts,
projects and incidents. Floor zones link to the existing controls without
placing orders or changing staffing. Yard animations are bounded and optional.

DOTv16 adds visual network news and finance trends with actual recorded data.
Operating costs, borrowing costs and recorded open project costs are kept
separate. Unknown amounts are not reported as zero cash spend.
