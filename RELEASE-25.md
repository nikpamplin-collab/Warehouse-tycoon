# DOTv25 · Different Ways to Win
Review candidate. The published game remains DOTv21 pending the human/device release checks.

- Three optional, scored starts, without changing the standard sandbox: Cash Squeeze (cash reserve and profitable closing months); Peak Contract (aggregate service through the booked surge); Win Back the Region (Northern wins, service and cash).
- Score locks at the advertised horizon. The player may continue to trade.
- Bids can display only fitting work and current bids; a multi-site summary distinguishes site contribution from company financing or management.
- Opening and scenario trials use existing trading, staffing, incidents and financial rules. Automated validation exercised distinct strategies, including six 36-month runs; this is not a substitute for fresh human playtesting or a full campaign review.
- Real iPhone Safari and five first-time uncoached players were not part of this automated run.

## Rollback rehearsal
1. The exact live DOTv21 commit is pinned by `rollback/DOTv21-live`. Restore its tree with a new forward commit on main; do not force-push or delete user data. Verify the live shell and worker before reporting recovery.
2. DOTv25 imports the old save into its own key. DOTv21’s key remains byte-for-byte untouched by candidate play. On a rollback, refresh **online** to replace the service worker. The game resumes its last v21 save, and v25 progress is retained separately, not merged backward.
3. Browser test: `WT_ROLLBACK_CHECK=1 WT_BROWSER_ONLY=Chromium WT_LEGACY_FOLDER=/path/to/exact-v21 node tests/browser.mjs`. It exercises v21 → v25, position/controls, offline resume, and v25 → v21 on the same origin, comparing both save copies and checking browser errors.
