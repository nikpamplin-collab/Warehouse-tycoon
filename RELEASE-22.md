# DOTv22 · The First Contract

**Review candidate. Not released.** DOTv21 remains live.

- Optional opening at a new save. The 200-pallet trial uses a disclosed price-only award rule, open to rivals under the same cap. The indicative price is competitive but not a guarantee. The starter contract contributes to overhead; it does not pretend to make an empty depot profitable on its own. A loss or missed bid leaves a recovery offer; the guide can be ended without interrupting the game.
- Tender cards explain the actual storage shortfall and indicative racking cost and date. A queued block does not qualify for the current bidding round.
- The next-turn Ops card explains the limiting resource using the shift, dock and management calculations already used in the simulation. The closing report ranks the main actual profit drivers and shows the detailed reconciliation, separate from financing cash movements. Exact competing bid values are no longer displayed.
- No baseline change to existing saved operations; the guide is opt-in at new-game setup.

## Candidate checks

- Node: `node --test tests/regression.mjs` (40 cases, including guided win/loss/skip, price sensitivity, forecast constraints and profit reconciliation).
- Chromium: `node tests/streamlined-browser.mjs` (320, 390, 1280px, layout, navigation and offline).
- Prior-build save: `WT_LEGACY_FOLDER=/path/to/v21 node tests/browser.mjs`; set `WT_BROWSER_ONLY=Chromium` for Chromium only.
- Required before proceeding: real iPhone Safari including save migration/background-resume, plus five new iPhone players uncoached. At least four should place a sensible first bid and explain the first result within ten minutes. Fix what the sessions expose on v22 before starting v23.
