# DOTv21 · Streamlined controls and interactive warehouse

- Five top-level destinations: Map, Ops, Bids, Invest and Cash. Persistent one-row touch navigation sits at the bottom on phones and at the top on larger screens. Rivals is one tap inside Map; the existing rival screen and actions are retained.
- Operations keeps current and planned throughput, signed demand, staffing, MHE, running cost and Apply in one card. Changes are an unsaved draft until Apply, and committed changes still take effect next turn. The forecast uses the existing rates, roster, dock, management and fleet functions. It cannot guarantee actual demand, incidents or random CI results. Managers, safety and the warehouse scene remain available under compact sections.
- Investment puts timing, cost, and effect next to the action. Storage shows a before/after comparison and cash left before payment. Flow covers docks, automation and CI; Risk covers staged fire projects. Expansion, credit and the project queue are separate sections. Bids show indicative full-volume revenue beside rate inputs, not a sales forecast.
- “Why it changes” starts open during development and can be folded away. The short labels and decision numbers remain visible. No market balance, save schema, operating rates, cash assumptions or incident rules were deliberately changed.
- Fixed the old DOTv16 footer label and verified the footer, document title and offline cache identify the same build. DOTv20 remains available on its release branch as a rollback point.

## Check locally

- `node --test tests/regression.mjs`
- `node tests/streamlined-browser.mjs` (including cutaway round trips) with Playwright Chromium installed. `WT_CHROMIUM` can select an existing headless Chromium binary.
- `WT_LEGACY_FOLDER=/path/to/v20 node tests/browser.mjs` for a real previous-build save and offline upgrade. Set `WT_BROWSER_ONLY=Chromium` to run without WebKit.

## Warehouse cutaway update

The scene separates installed rack blocks as a share of potential fit-out from active pallet commitments as a share of current pallet capacity. An in-game example of 1,250 of 2,250 active positions is about 56%; the display shows roughly that share of representative pallet positions, not one sprite per real position. Future booked work does not fill the current scene prematurely. The rack artwork uses two pallets side-by-side on the slab plus three supported beam levels. Storage, handling and construction readouts are outside the scene.

A staffed site shows representative walking figures; material handling equipment is visible only when trucks have arrived, with truck motion only when staff are assigned and there is signed handling work. The exterior tank and pump house and installed sprinkler stages appear only when commissioned, with pending work reported separately. The cutaway includes a zoom control, a pause button, and respects reduced motion. Drawn figures and layouts do not feed back into the engine.

The cutaway now sits in a landscape, with a marked loading apron, a continuous entrance to a two-lane road, grass verges, a boundary hedge and trees. These are illustrative grounds only; the yard art does not add capacity, routes or simulation rules.

A cutaway office shows separate workstations for H&S, stock control and operations management. Each appointed role has a representative figure; unfilled roles have empty seats. The warehouse slab no longer has cross-floor dashed stripes; public-road markings and local dock and pedestrian markings remain.

Staffed office desks now have a shield, stock box or operations chart above the manager. With no racks, stock is shown as dense, two-high block stacks, filled proportionally up to the displayed base pallet capacity (250 at a starter site). The rear elevation draws one door for each commissioned dock, not queued ones, and the yard markings follow their positions. When there is active handling, one 29-second visual cycle shows a lorry turn in from the road, reverse onto the first bay, unload a pallet and depart. Pause freezes the cycle; reduced motion shows a stationary docked lorry. None of the artwork changes handling, stock or construction.

## Click-through navigation

Tap warehouse objects in either the main or enlarged cutaway to go straight to the relevant controls: racking and floor storage, capacity, staff and office roles, MHE, docks and automation, sprinkler upgrades, expansion, and projects. Common destinations also have named shortcuts. While away, a fixed **Back to warehouse visual** button restores the original site, scene mode, viewport position, and enlarged view if it was open. Keyboard activation and focus return are supported. Navigation does not write to the saved game.
