# 線上測試版驗證

網址：https://and14122001.github.io/convertx-ios/cad-test/

版本：a05e4bfafdb69c5800af7f987a1b3237bfd92317（build-info.json，preview，formalAcceptance=false）。

實際驗證：
- 雲端 Chrome 開啟頁面，顯示正確版本標記、紙張控制、本機字型輸入與禁用中的 PDF 按鈕（尚未載入 DWG）。
- 瀏覽器顯示「離線狀態：完整建置資產已快取；仍須實機離線驗收」。
- manifest 的 14 個資源全部 HTTP 200；HTML 使用建置後 assets/index-BWEsPkyq.js，不再引用 src/main.ts。
- Worker MIME 為 application/javascript；WASM MIME 為 application/wasm，10,882,182 bytes；線上 SHA-256 faf887bddb97fa8075ce718aaae578ea2af33bb091c9cf123df75c1d5b212abf，與固定來源一致。
- 同站 cad-source/SHA256SUMS.txt HTTP 200。
- 此次未在瀏覽器選取真實工程 DWG，未驗證 iPhone、飛航重啟或 PDF 保真。部署與快取成功不代表正式完成。
