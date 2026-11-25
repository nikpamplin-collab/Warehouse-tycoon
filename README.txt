WAREHOUSE TYCOON | DOTv17

Open index.html via a local HTTP server or the GitHub Pages deployment.
Use the same browser profile and Pages address to continue an existing save.
Do not clear site data. DOTv17 keeps the previous save key and makes a
one-time backup of the configured save on first load when storage permits.

What changed
- Operations is for the warehouse: forecast, team, equipment and stock
  control. Investment is for sites, racking, expansion, automation, projects
  and borrowing. Finances shows trading results and the contract book.
- New warehouse extensions take six months instead of nine. Work already
  in progress keeps its remaining countdown.
- Use the next-month forecast to queue staffing. Current payroll and
  capacity do not change until the next month.
- Manual sections have lower hand-only throughput. Leasing MHE adds 30%
  to manual productivity and costs £650 per non-automated section per month.
  It is not charged for automated sections.
- A stock control manager costs £3,000 per site per month and lowers both
  the likelihood and severity of stock losses and resulting customer claims.
- Fit an extra dock door when dock capacity is the actual constraint. It
  costs £28,000, takes one month, and adds up to 5,500 moves per month.
  Labour and management can still limit the result.
- Sprinklers take two months to retrofit. They lower fire risk, not other
  safety risks, and come with inspection costs.
- Rival operators sustain competition longer. Warehouse diagrams are static
  and still show assets, bottlenecks, incidents and work in progress.

Checks
- node --test tests/regression.mjs
- Browser suite: provide WT_V12_FOLDER pointing at the v12 release, install
  Playwright (Chromium and WebKit), and run node tests/browser.mjs.
- node tests/navigation-browser.mjs adds a desktop and small-screen check.
