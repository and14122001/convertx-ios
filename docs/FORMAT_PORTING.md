# ConvertX iOS Full — 格式移植追蹤

上游：https://github.com/C4illin/ConvertX

## 原則
- 不將「上游引擎可讀取的格式」誤報成 iPhone 已支援。
- GitHub Pages 為純靜態部署；所有本機轉換需由 Safari JS / WebAssembly 執行。
- 每條轉換路徑需記錄輸入、輸出、限制、測試樣本、iOS Safari 實測與離線測試。
- 離線優先；不自動上傳使用者檔案。
- 優先修正已存在功能，之後再引入較大型 WASM 模組。

## 上游引擎追蹤（不是已實作清單）
| 引擎 | 範圍 | iOS 方案 | 狀態 |
|---|---|---|---|
| ImageMagick / GraphicsMagick / Vips | 圖片 | Canvas + WASM | 部分已實作 |
| libheif / libjxl | HEIF / JPEG XL | Safari 解碼或 WASM | 待移植 |
| FFmpeg | 影音 | WASM / 原生 App 替代 | 待移植 |
| LibreOffice / Pandoc / Markitdown | 文件 | JS 解析器 / WASM | 待移植 |
| Calibre | 電子書 | EPUB 解析器 / WASM | 待移植 |
| Dasel | 結構化資料 | JS 解析器 | 待移植 |
| msgconvert / VCF to CSV | 郵件 / 聯絡人 | JS 解析器 | 待移植 |
| Inkscape / resvg / dvisvgm | 向量 | SVG / WASM | 待移植 |
| Potrace / VTracer | 點陣轉向量 | WASM | 待移植 |
| Assimp | 3D | WASM / 專用解析器 | 待移植 |
| XeLaTeX | LaTeX | WASM / 專用渲染器 | 待移植 |
| pdftops / DjVuLibre | PDF / DjVu | JS / WASM | 待移植 |

## 目前已提交程式（尚待 iPhone 實機驗收）
- JPG / PNG / WebP 轉換、縮圖、品質控制、批次處理
- ZIP32 不壓縮封裝
- 多圖片合併 PDF 1.4

## 驗收門檻
1. 使用至少兩個不同來源的真實測試檔案。
2. 驗證檔頭、可開啟性、輸出內容、頁數或時長。
3. iPhone Safari 與主畫面 PWA 各測一次。
4. 斷網後重啟 PWA 再測。
5. 記錄失敗格式、記憶體上限與轉換耗時。

## 後續順序
1. 格式能力註冊表（實作、部分、未支援）與輸入檢查。
2. JSON / CSV / XML / YAML / TOML、VCF 轉 CSV。
3. PDF 拆頁與轉圖片。
4. SVG 與進階圖片格式。
5. 音訊 / 影片 WASM。
6. Office / EPUB / 3D 依實測逐步移植。

每次開發需同步更新本文件，保留 commit 紀錄。