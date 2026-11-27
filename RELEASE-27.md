# Warehouse Tycoon DOTv27
## The warehouse is Home
- Home shows the cutaway and the UK territory zoom, without the business dashboard or Next Decision section. Click a warehouse object for live figures, follow its controls, and return to the same depot. A separate Complete month control preserves the turn loop, event choices, challenges and the guarded quiet-month skip.
- Ops Office puts next-month forecast and capacity side by side with Safe, Close (90–100%) and Breach labels. Dock time and staff/equipment capacity are distinct; combined effective capacity is in the info popup. Shift and forklift edits preview live and commit only when saved. Manager impacts and chart definitions are available on request.
- Invest shows Buy, price, lead time and the main effect. Borrowing has ordinary and starter loan controls plus repayment. Expansion and the reviewed v26 mortgage remain available; fire stays with investment.
- Rivals compares two operators side by side, including capacity, actual results and cash. The full operator table and investment actions remain below. Bids and Finances keep their original views.
- This release does not rebalance the simulator. It imports existing v26, v25 and supported earlier saves without overwriting their storage, and uses a version-specific offline cache. Returning to v25 resumes the prior v25 save; v27 progress does not merge backwards.

## Verification
Run `node --test tests/regression.mjs tests/growth-v26.mjs tests/copy-v26.mjs` and `node tests/desks-v27-browser.mjs`. Browser coverage includes 320/390px portrait, 844px landscape, and desktop, with real engine transactions and offline navigation. Set WT_LEGACY_FOLDER to a copy of v25 to rehearse same-origin deployment and rollback. These are automated Chromium checks; iPhone Safari hardware was not tested.
