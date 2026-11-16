# Font isolate readiness regression

Source: 173c172d20c907111121e0ff129d66e459d2f862
Generated assets: 0c51a9f0b9722e07baa505837e7b6d79214be113

User reported opening failed in 0.6 s at the built-in-font gate. Inspected pinned AcTrMTextRenderer and UnifiedRenderer implementations: scope all operates on Worker isolates; it does not populate the main FontManager map. Old code asserted main-map readiness after only the Worker load. New code explicitly loads and verifies main-thread fonts before renderer synchronization.

Font preparation and catalog errors preserve geometry preview with a warning. PDF preparation remains strict and retries the checks. A new UI button exercises the same initialization/preparation path without a DWG.

Executed npm ci --ignore-scripts --no-audit --no-fund, npm run build and git diff --check: 100 tests / 22 files, TypeScript, Vite and offline/dist checks passed. GitHub run 43890009687 install, build and source/asset publication steps passed.

Worker wrapper returns dispatched names rather than verified per-worker glyph success; UI wording states request completion only. iPhone whole-drawing PDF fidelity and flight-mode acceptance remain pending.
