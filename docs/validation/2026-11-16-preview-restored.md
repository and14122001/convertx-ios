# Preview regression fix

Source commit `7a97cd01106f613f59d3f7e7348cb4df738c9640`; tested tree `fd4fa594a25cb4ff117ac5978b049d3363a98f5e`.

The previous b7770e2 font-preflight hard stop was a product regression: missing fonts must not prevent opening available drawing geometry. Preflight now returns the same parsed model with diagnostics, preview uses progressive rendering, and PDF fidelity checks remain separate. A preview is not a guarantee of text fidelity.

Executed: npm ci --ignore-scripts --no-audit --no-fund; npm run build (85 tests/18 files, TypeScript, Vite, offline manifest and dist checks PASS). GitHub workflow https://github.com/and14122001/convertx-ios/actions/runs/43837752996 completed successfully.

Local original-DWG regression with --preflight now continues past 10 missing-font diagnostics to build 41,207 database entities / 1,273 blocks; parse 7,287 ms, parse+convert 7,947 ms. This is Linux Node, not iPhone rendering timing. Native LibreDWG warning 76 and 14 unresolved style sources remain; no reference-PDF fidelity or real-device acceptance claim. Private drawing data not committed.

Test: https://and14122001.github.io/convertx-ios/cad-test/?v=7a97cd0 . Close prior tabs, confirm banner 7a97cd0, select DWG. Expected: geometry preview continues with font warnings, rather than Failed to Open File due only to missing fonts. Actual iPhone display still requires user verification.
