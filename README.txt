Warehouse Tycoon v11.1

Release based on Warehouse Tycoon v11. The game runs from index.html in a browser or static web host.

Changes:
- Regional underlying market demand begins at 65% of v11, growing by 5% at the start of each 12-month period (month 13, 25, etc.), compounded annually.
- Player and rival warehouse capacity no longer increases tender sizes or creates new regional demand.
- Tender sizes are driven by market conditions, not the largest warehouse in the region.
- Warehouse expansion costs GBP 350,000 and takes nine monthly turns, for player and AI rivals.
- Fixed operating costs for racked pallet locations have been rebalanced to target approximately 75% break-even occupancy for a representative fully racked Midlands section at baseline rates, three moves per stored pallet, efficient staffing and an H&S manager. This is not a guaranteed break-even point for every site.
- Rival expansion thresholds adjusted to avoid overbuilding under the smaller market.
- Previous v11 features remain in place.

Save compatibility: retains the v11 localStorage save key and imports v10 saves where available. Existing signed contracts are not reduced or cancelled automatically. Existing active construction projects retain their remaining time and paid cost; newly started expansions use v11.1 terms.

Deploy all files together on the same origin as the previous game to preserve browser saves. The service-worker cache version has been updated.

Validation: JavaScript syntax check and scripted smoke tests of annual growth, capacity-independent market demand, expansion cost, nine-turn completion and illustrative break-even economics. Full interactive browser playthrough and 36-turn balancing validation are still recommended.
