WAREHOUSE TYCOON | DOTv20

Play at https://nikpamplin-collab.github.io/Warehouse-tycoon/ or serve this
directory from a local HTTP server. Keep your browser profile and the same
Pages address to continue an existing game. Do not clear site data. DOTv20
backs up an existing configured game before migration when storage permits.

Release decisions and the changes at each rollback point:
- RELEASE-18.md: storage, RH&D, spot tenders, premises and finance.
- RELEASE-19.md: shift rosters, trucks, dock capacity and improvement limits.
- RELEASE-20.md: staged fire protection, graphical commissioning and savings.

Checks:
- node --test tests/regression.mjs
- Browser upgrade and navigation: install Playwright, provide WT_V12_FOLDER
  pointing at the v12 release, and run node tests/browser.mjs. For a standalone
  desktop and small-screen check run node tests/navigation-browser.mjs.
