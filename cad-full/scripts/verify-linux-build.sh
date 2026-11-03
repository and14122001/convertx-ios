#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")/.."
echo "[ConvertX] Linux build preflight"
node --version
npm --version
if [[ "$(uname -s)" != "Linux" ]]; then
  echo "ERROR: Run in Linux Codespaces; iOS esbuild native binary is unsupported." >&2
  exit 2
fi
npm install --no-audit --no-fund
npm audit --audit-level=moderate
npm test
npm run check
npm run build
test -s dist/index.html
test -s dist/sw.js
for asset in mtext-renderer-worker.js libredwg-parser-worker.js libredwg-web.wasm; do
  test -s "dist/assets/$asset" || { echo "ERROR: missing dist/assets/$asset" >&2; exit 3; }
done
echo "[ConvertX] PASS: Linux build, assets and service worker generated"
echo "[ConvertX] PENDING: Safari offline DWG -> PDF functional acceptance"
