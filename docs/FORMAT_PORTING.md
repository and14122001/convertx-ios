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

## 2026-11-03 GitHub 開源引擎選型（研究完成，尚未整合）
來源：
- 原版格式引擎：https://github.com/C4illin/ConvertX
- 多格式瀏覽器引擎：https://github.com/hushvert/engine
- 影音：https://github.com/ffmpegwasm/ffmpeg.wasm
- PDF 閱讀：https://github.com/mozilla/pdf.js
- PDF 編輯：https://github.com/Hopding/pdf-lib
- 資料格式參考：https://github.com/harsh98trivedi/MultiFormat-Data-Converter

### 決策
1. **首選候選：hushvert/engine**。先檢查授權、依賴、建置產物、GitHub Pages 子路徑、Worker/WASM 載入及 Safari 相容性；通過後才實際導入。
2. PDF.js + pdf-lib 先作為 PDF 渲染及操作候選；避免繼續擴充未充分測試的自製 PDF 引擎。
3. ffmpeg.wasm 先以單執行緒、小型音訊測試；GitHub Pages 難以自行設定跨來源隔離標頭，不能直接假設多執行緒可用。
4. 先建立可查詢的轉換路由矩陣，僅對實際成功測試的 input→output 開放轉換按鈕。
5. 不使用會將私人檔案上傳到雲端的免費 API；不得宣稱原版所有格式都可在 iOS Safari 本機完成。

### 待執行驗證
- [ ] 查明各候選套件與轉換核心的 SPDX 授權、再散布義務。
- [ ] 本機 build，將必要 JS/WASM/Worker 資產放在 GitHub Pages 同源路徑。
- [ ] iPhone Safari 測試 HEIC→JPG、PDF→PNG、PDF 合併、CSV↔JSON、WAV→MP3。
- [ ] 飛航模式重新啟動 PWA，確認核心資產可用。
- [ ] 記錄輸入檔案大小、峰值記憶體、耗時、失敗模式。
- [ ] 確認大檔、Office、3D 等功能不可行時的替代架構。

### 完成定義
本節為**開源候選選型與開發待辦**，不是全格式引擎已實作。任何「支援」標示須有可重現測試證據。

## 2026-11-03 實作紀錄：SVG rasterization
- 新增 `svg.html`，SVG→PNG/JPG/WebP；Canvas 原生解碼，無第三方依賴、無上傳。
- 限制：2 MB SVG、最大單邊 8192 px、最多 1600 萬畫素；僅支援靜態且不含外部資源的 SVG 子集。
- 已阻擋 script、foreignObject、事件屬性、外部引用、CSS url()、DTD/ENTITY 等常見風險；不保證能安全處理任意惡意 SVG，後續仍需安全審核。
- 已更新首頁連結與 Service Worker 預快取。
- **尚未完成 iPhone Safari 實機與離線重啟驗收**，不得標示為全面相容。
