# DWG 對應原始碼稽核 — 2026-11-16

狀態：部分已驗證，正式發行未通過。不得把文件存在當成 GPL 完成。

| 發行套件 | 固定來源 |
|---|---|
| @mlightcad/libredwg-converter 3.15.21 | https://github.com/mlightcad/realdwg-web/tree/e03b9f2ca005506880855b0a55f236fef7c7530a/packages/libredwg-converter |
| @mlightcad/libredwg-web 0.8.3 | https://github.com/mlightcad/libredwg-web/tree/b5177613f2c735858a6d1cb1d1c7e238c397b88f |
| MLightCAD glyph source v1.7.8 | https://github.com/mlightcad/cad-viewer/blob/c6c14f90e46bedbe9d6e6cf7faa7851d3f3490ad/packages/cad-pdf-plugin/src/AcApPdfGlyphProvider.ts |

實際 clone 上述來源及安裝固定 npm 套件，確認 converter 的 dist/libredwg-web.wasm 與 libredwg-web 固定來源 bindings/javascript/wasm/libredwg-web.wasm 完全一致：

```
SHA-256 faf887bddb97fa8075ce718aaae578ea2af33bb091c9cf123df75c1d5b212abf
size 10882182 bytes
```

- GPL 全文從安裝的 converter/LICENSE 複製到 public/legal/GPL-3.0.txt。
- MIT 字形移植保留 public/legal/MLIGHTCAD-MIT.txt；本機修改包含拆分純幾何模組、字形錯誤回報與空文字幾何阻擋。
- 對應 C、JS、TS 原始碼及 build scripts 在上述固定 SHA；WASM 編譯腳本 bindings/javascript/script/build-wasm.mjs、build:prepare/build:obj/build:wasm；需要 Emscripten 與完整依賴。
- libredwg-web 的 jsmn submodule 固定 `85695f3d5903b1cd5b4030efe50db3b4f5f3c928`。完整來源發行須包含此內容及其他所需子模組，不能只提供缺子模組的 GitHub zip。
- 尚未由完整對應來源重建 WASM、封裝可取得的完整 source bundle 或驗證所有轉移依賴 notices。正式發行閘門仍缺 public/legal/DWG-SOURCE.md，`CAD_RELEASE=1 npm run check:dist` 應失敗。不得為使檢查通過而填佔位 source offer。
- 預算 0，本批未觸發 Actions 或使用付費編譯服務。
