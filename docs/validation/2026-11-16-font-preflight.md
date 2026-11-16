# 2026-11-16 原始工程圖預檢驗證

Source commit: `b7770e2204a323d036077db16ef60cda8ee1437f` (tree `92a597f499e76bda1b85168536d5ba25fa5b7d7c`, identical to local tested tree).

- `npm ci --ignore-scripts --no-audit --no-fund`: PASS.
- `npm run build`: 85 tests / 18 files, TypeScript, Vite 7.3.8, offline generation and dist checks PASS; 12 distribution files, 21,863,042 bytes before preview banner packaging.
- GitHub workflow https://github.com/and14122001/convertx-ios/actions/runs/43824764827 : install, test/build, source packaging, generated assets commit steps PASS (post-job cleanup still running when this evidence file was created).
- `node scripts/profile-local-dwg.mjs <local DWG>`: 10,098 ms parse+DB, 41,207 DB entities; native parser warning 76. No PDF fidelity assertion.
- `node scripts/profile-local-dwg.mjs <local DWG> --preflight`: 11,634 ms to metadata gate; 10 known font requirements missing, 14 unresolved style sources; stopped before DB and preview expansion. This is Linux Node and cannot be presented as iPhone timing or a successful-export speedup.
- Real file and recording stayed local; no private CAD file, text contents or geometry committed.
- Chromium launch failed with socket Operation not permitted. Browser glyph rendering, original drawing PDF and real iPhone offline acceptance remain unverified.

Test URL: https://and14122001.github.io/convertx-ios/cad-test/?v=b7770e2

Confirm preview banner `b7770e2`. Close older site tabs before loading the new version. With missing original fonts, the expected result is an early font preflight report and a disabled PDF button; **not** a falsely successful blank/text-omitted PDF. Unresolved style sources, inline fonts, MLEADER and parser warning propagation require further work; no formal completion claim.
