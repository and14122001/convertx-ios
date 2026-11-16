# Deployed browser check — 173c172

Date: 2026-11-16 UTC.

Source commit: 173c172d20c907111121e0ff129d66e459d2f862.
Generated assets: 0c51a9f0b9722e07baa505837e7b6d79214be113.
CAD build workflow 43890009687: completed / success.
Pages workflow 43890197283: completed / success.

Opened https://and14122001.github.io/convertx-ios/cad-test/?v=173c172 in the cloud Chrome browser. Initial cached page showed ad33c2e. Reload after deployment showed banner 173c172 and the new 檢查內建字型 button.

Clicked 檢查內建字型. Observed:

> 內建字型檢查失敗：Error: THREE.WebGLRenderer: Error creating WebGL context.

The environment failed viewer initialization before the font-loading check. This is NOT a passing browser font test. The page also reported 離線資產安裝失敗；請連網重新開啟; offline readiness was not established in this browser.

No private drawing was uploaded. No end-to-end DWG rendering, PDF fidelity, iPhone Safari, or airplane-mode acceptance is claimed. Local build and 100 automated tests are recorded in font-isolate-173c172.md. Physical-device verification remains required.
