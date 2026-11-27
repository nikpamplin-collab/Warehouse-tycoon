# DOTv21 · Streamlined controls (review branch)

- Five top-level destinations: Map, Ops, Bids, Invest and Cash. Persistent one-row touch navigation sits at the bottom on phones and at the top on larger screens. Rivals is one tap inside Map; the existing rival screen and actions are retained.
- Operations keeps current and planned throughput, signed demand, staffing, MHE, running cost and Apply in one card. Changes are an unsaved draft until Apply, and committed changes still take effect next turn. The forecast uses the existing rates, roster, dock, management and fleet functions. It cannot guarantee actual demand, incidents or random CI results. Managers, safety and the warehouse scene remain available under compact sections.
- Investment puts timing, cost, and effect next to the action. Storage shows a before/after comparison and cash left before payment. Flow covers docks, automation and CI; Risk covers staged fire projects. Expansion, credit and the project queue are separate sections. Bids show indicative full-volume revenue beside rate inputs, not a sales forecast.
- “Why it changes” starts open during development and can be folded away. The short labels and decision numbers remain visible. No market balance, save schema, operating rates, cash assumptions or incident rules were deliberately changed.
- Fixed the old DOTv16 footer label and verified the footer, document title and offline cache identify the same build. Branch only; DOTv20 remains live pending a separate release decision.

## Check locally

- `node --test tests/regression.mjs`
- `node tests/streamlined-browser.mjs` with Playwright Chromium installed. `WT_CHROMIUM` can select an existing headless Chromium binary.
- `WT_LEGACY_FOLDER=/path/to/v20 node tests/browser.mjs` for a real previous-build save and offline upgrade. Set `WT_BROWSER_ONLY=Chromium` to run without WebKit.
