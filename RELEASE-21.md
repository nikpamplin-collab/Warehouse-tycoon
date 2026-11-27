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

## Warehouse cutaway update

The scene separates installed rack blocks as a share of potential fit-out from active pallet commitments as a share of current pallet capacity. An in-game example of 1,250 of 2,250 active positions is about 56%; the display shows roughly that share of representative pallet positions, not one sprite per real position. Future booked work does not fill the current scene prematurely. The rack artwork uses two pallets side-by-side on the slab plus three supported beam levels. Storage, handling and construction readouts are outside the scene.

A staffed site shows representative walking figures; material handling equipment is visible only when trucks have arrived, with truck motion only when staff are assigned and there is signed handling work. The exterior tank and pump house and installed sprinkler stages appear only when commissioned, with pending work reported separately. The cutaway includes a zoom control, a pause button, and respects reduced motion. Drawn figures and layouts do not feed back into the engine.
