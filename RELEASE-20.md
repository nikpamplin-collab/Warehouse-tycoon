# DOTv20 decisions: fire protection and the cutaway

- Replaced the one-button £18k retrofit with a staged system: **tank and pump house first** (£40,000 for one 25,000 sq ft section; £5,000 per further section of water-supply provision), **roof sprinklers** (£38,000 per section), then **in-rack sprinklers** where racking exists (£20,000 per section). Initial water + roof is £78,000; whole first section with in-rack cover is £98,000. Budget assumptions, not installation quotes or engineering advice. The public rationale is [BAFSA warehouse guidance](https://www.bafsa.org.uk/assets/Downloads/BIF5_warehouses.pdf), [Business Sprinkler Alliance indicative installation rates](https://www.business-sprinkler-alliance.org/cost-of-sprinklers/details/cost-per-square-metre), and the [BRE breakdown by system and warehouse size](https://files.bregroup.com/bre-co-uk-file-library-copy/filelibrary/pdf/rpts/partb/Sprinkler_installation_trends_and_fire_statistics.pdf).
- Tanks and roof pipework take two turns each; rack fit-out takes one. Previously commissioned protection stays live during upgrades. Expansion requires deliberate extension of water and roof/rack protection. Water-only and unfinished systems do not mitigate fires.
- No change to the ignition or ordinary H&S event probability. Site-wide roof protection reduces fire loss and disruption by 55%; complete in-rack cover adds 25 percentage points. Partial coverage scales by protected area proxy (section count); the percentages are gameplay calibrations, not claims about fire outcomes. Monthly service allowances: £120 for commissioned water supply, £60 per roof-covered section and £50 per in-rack section.
- The cutaway shows the external tank and pump house, roof lines and rack branches with a commissioning/fit-out legend. The project board, event badges and capital commitments recognise all three stages. Existing v17 commissioned sprinkler systems carry over as owned tank + roof coverage at the existing footprint; a paid, queued legacy job still completes without a second charge. Neither grants free rack coverage or protection for future extensions.
- Tests cover ordering, prerequisites, affordability, duplicates, timing, section growth, unchanged ignition frequency, reduced cost and disruption, financial reporting, SVG states and legacy saves. DOTv19 and DOTv18 are staged rollback points; neither should be replaced by a partial v20 deployment.

## Final release checks

The integrated run passed 28 automated checks, including six seeded
96-turn rival runs, facility/loan/shift checks, save migration, and offline
cache rules. Browser checks covered Chromium desktop and an iPhone-sized
touch layout, v12 save upgrade, tab navigation and staged fire orders with
save persistence, visible commissioning and offline reload. Browser-profile
coverage is not a test on a physical iPhone.
