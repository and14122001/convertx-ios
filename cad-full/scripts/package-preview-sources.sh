#!/usr/bin/env bash
set -euo pipefail
out="$(pwd)/_site/cad-source"
mkdir -p "$out"
task_sources="${CONVERTX_SOURCE_ROOT:-$(mktemp -d)}"
fetch_source() {
  local name="$1" repo="$2" ref="$3" sha="$4"
  if [ ! -d "$task_sources/$name/.git" ]; then git clone --depth 1 --branch "$ref" "https://github.com/$repo.git" "$task_sources/$name"; fi
  test "$(git -C "$task_sources/$name" rev-parse HEAD)" = "$sha"
}
fetch_source upstream-libredwg-web mlightcad/libredwg-web v0.8.3 b5177613f2c735858a6d1cb1d1c7e238c397b88f
fetch_source upstream-realdwg mlightcad/realdwg-web v1.15.21 e03b9f2ca005506880855b0a55f236fef7c7530a
fetch_source upstream-mlightcad mlightcad/cad-viewer v1.7.8 c6c14f90e46bedbe9d6e6cf7faa7851d3f3490ad
git -C "$task_sources/upstream-libredwg-web" submodule update --init --recursive
cmp cad-full/node_modules/@mlightcad/libredwg-converter/dist/libredwg-web.wasm "$task_sources/upstream-libredwg-web/bindings/javascript/wasm/libredwg-web.wasm"
for name in upstream-libredwg-web upstream-realdwg upstream-mlightcad; do
  tar --exclude='.git' -czf "$out/$name.tar.gz" -C "$task_sources" "$name"
done
git archive --format=tar.gz --prefix=convertx-ios/ HEAD -- . ':!cad-test' ':!cad-source' > "$out/convertx-ios.tar.gz"
(cd "$out" && sha256sum *.tar.gz > SHA256SUMS.txt)
