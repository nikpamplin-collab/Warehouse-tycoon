# DOTv26 review: physical capacity and funding growth

This branch does not change the live v25 game.

- Invest → Racking & docks puts pallet space, dock doors, dock capacity and dock orders together. The warehouse cutaway’s doors link back to this panel. Ops safety now covers people and fire protection, not dock upgrades.
- The starter loan gives free-play companies up to £100,000 across months 1–12, in £25,000 draws. No collateral or trading history required. 8% annual rate, repaid monthly over 36 months, no renewing allowance after repayment.
- Owned expansion still costs £1,000,000 and opens in six months. In free play, the alternative to paying cash is a £250,000 deposit with a £750,000 mortgage over 25 years at an 8% annual rate (about £5,789/month from the current month). The loan goes directly to the build and cannot be cashed out. Only one mortgage-funded extension can be in construction at a time. A mortgaged order cannot be cancelled after drawing the loan. Loans remain visible in the business’s debt and interest/principal reporting.
- Unlock with six consecutive profitable months, a monthly surplus covering the payment after removing short-term job revenue and existing principal payments, and enough cash for the deposit plus a month of costs. The approval is not proof the expansion will make money. Racking and extra monthly operating costs are separate and shown before committing.
- The £1m is a retained game assumption (£40/sq ft), not an all-in UK build quote. [Cumming Group's March 2025 UK warehouse cost breakdown](https://cumming-group.com/wp-content/uploads/2025/04/Cumming-Group-Market-Insights-Report-Q1-2025.pdf) shows a similar warehouse element but higher costs once offices and outside works are included. We are improving financing rather than discounting construction or adding leases.
- No change to challenge funding, standard asset-backed business loans, or dock and racking simulation rules. The v26 save is separate; an existing v25 save imports without being overwritten. A rollback reads the original v25 progress, not subsequent v26 moves.
- Tests: cash and debt accounting, 300 payments, six-month gate, project completion, stock/dock controls, six-seed early-game exploration and a repeatable 36-month expansion test. In three trading runs with an extra £75k set aside for racking, loans were taken in months 21–26, extensions completed and all three remained cash-positive at month 36. A tight-cash build can still fail; it is not meant to be an automatic upgrade.


## Approved terminology pass

Applied the full player-facing wording review across Warehouse view, Ops, Bids, Investment, Map, Rivals, Cash, results and setup. Uses month consistently, explains pallet moves and storage-only bid fit, and separates booked storage from activity and profit from cash. Dock doors stay with racking, not in the Safety panel. The mortgage shows cash now and cash left after the £250k deposit; undrawn credit does not count. No changes to simulation or loan rules in this pass.
