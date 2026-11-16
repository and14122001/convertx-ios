# Live font-settings smoke check

2026-11-16, source `f1f4400934ad1510eba0c80fea131c81a6188e4f`.

Opened https://and14122001.github.io/convertx-ios/cad-test/?v=f1f4400 in the Work cloud browser. The visible build banner matched f1f4400. Expanded the local font library/settings section; the empty-library prompt and original/substitute PDF mode, source-name input, target-font selector and save-mapping control appeared. The previous catalog JSON parsing error was absent.

Pages run 43845818507 deployed generated commit bfa4d4d4eab0472ca7f6804916ffa0e88e6e3095 successfully. Offline status was still downloading assets at the final observation, not accepted as an offline test.

File selection previously timed out at the browser tool boundary and the session was lost. This smoke check verifies page initialization/settings visibility only, not TTC import, DWG rendering, vector PDF fidelity, downloads or iPhone Safari/PWA flight-mode behavior.
