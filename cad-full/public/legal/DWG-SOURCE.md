# DWG→PDF 測試版：授權與對應原始碼
這是開發驗證版，不是正式保真認證版本。CAD 檔案由瀏覽器本機處理。
DWG 元件 @mlightcad/libredwg-converter **3.15.21** / @mlightcad/libredwg-web **0.8.3** 依 GPL 發行；全文見 [GPL-3.0.txt](./GPL-3.0.txt)。ConvertX 原有 MIT 程式碼保留原授權，包含 GPL 元件的組合發行不能被宣稱為純 MIT。

## 同站完整來源下載
- [LibreDWG C／JS／建置來源，含 jsmn 子模組](../../cad-source/upstream-libredwg-web.tar.gz)：b5177613f2c735858a6d1cb1d1c7e238c397b88f，v0.8.3。
- [DWG converter 與 data-model TS 來源](../../cad-source/upstream-realdwg.tar.gz)：e03b9f2ca005506880855b0a55f236fef7c7530a，v1.15.21（converter 3.15.21）。
- [MLightCAD viewer／PDF／字形來源](../../cad-source/upstream-mlightcad.tar.gz)：c6c14f90e46bedbe9d6e6cf7faa7851d3f3490ad，v1.7.8。
- [本次 ConvertX 修改與 lockfile](../../cad-source/convertx-ios.tar.gz)，確切 commit 見 [build-info.json](../build-info.json)。
- [來源封裝 SHA-256](../../cad-source/SHA256SUMS.txt)。封裝保留上游 LICENSE／COPYING 與 build scripts。

上游：https://github.com/mlightcad/libredwg-web 、https://github.com/mlightcad/realdwg-web 、https://github.com/mlightcad/cad-viewer 。jsmn 子模組固定 85695f3d5903b1cd5b4030efe50db3b4f5f3c928，包含在第一份封裝。
發布前逐 byte 比對 npm WASM 與固定來源 binary：SHA-256 faf887bddb97fa8075ce718aaae578ea2af33bb091c9cf123df75c1d5b212abf。

## 重建與限制
解開 ConvertX，在 cad-full 執行 `npm ci --ignore-scripts --no-audit --no-fund`、`npm run build`（Node 24）。LibreDWG 原生編譯依 README、bindings/javascript/package.json、script/build-wasm.mjs；需 Emscripten，依序 build:prepare、build:obj、build:wasm，再 build。從 C 重編至 byte-identical WASM 尚未驗證，不能聲稱原生 binary 可重現。
MIT 字形 notice 見 MLIGHTCAD-MIT.txt。自行載入的字型不會上傳或隨網站再散布。圖元保真、iPhone 字型快取與離線重啟仍待實測。
