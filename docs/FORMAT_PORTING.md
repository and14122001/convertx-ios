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

## 2026-11-03 優先級變更：AutoCAD DWG / DXF（使用者明確指定）
**P0：CAD 轉換優先於 PDF、影音、Office 的後續擴充。**

### 開源候選（尚未整合）
- https://github.com/mlightcad/cad-viewer — MIT，瀏覽器 DWG/DXF 檢視/編輯核心；先核對實際版本、匯出 API 與所有轉移依賴授權。
- https://github.com/linkiez/DXF-Renewed — DXF→SVG、區塊 INSERT 展開及 2D 渲染備援。
- https://github.com/gdsestimating/dxf-parser — MIT，DXF 解析；非 DWG 編碼器。

### 實作里程碑
1. [ ] 在獨立 CAD 模組導入可同源部署的 DWG/DXF 解析器與 Worker/WASM 資產，無 CDN 執行依賴。
2. [ ] DWG、DXF 讀取與預覽，顯示圖層、模型空間與實際單位，遇未知單位不推測。
3. [ ] 2D DXF→SVG、PNG、PDF，保留幾何比例、圖層與可選圖框。
4. [ ] DWG→DXF：先驗證原始幾何、文字、尺寸、BLOCK、HATCH、XREF、線型與圖層是否能保真匯出。
5. [ ] DXF→DWG：僅在取得經授權且可在 iOS Safari 離線執行的 DWG writer 後啟用，否則明確標記不支援。
6. [ ] 兩份真實工程圖（包含 BLOCK/INSERT、尺寸、中文、不同單位）交叉比對；iPhone Safari、PWA、飛航模式驗收。
7. [ ] 實測大檔記憶體、執行時間、字型缺失及 XREF 外部參照的處理。

### 安全與精度
- DWG/DXF 不上傳伺服器；不自動下載外部參照。
- **不臆測 CAD 管徑、壓力、流量、比例或缺失圖元**。
- 解析器的「能顯示」不等於轉檔保真；缺少實測證據的路徑不得顯示「已支援」。
- 先保留現有 v0.5+ 功能，不重構首頁以免影響既有轉換器。

## DWG 開源授權查核（2026-11-03）
上游來源：https://github.com/mlightcad/cad-viewer
- `@mlightcad/cad-simple-viewer` 的 MIT DXF 讀取與 DWG 讀取**不同**。
- 開源 DWG 路徑需另行引入 `@mlightcad/libredwg-converter`，該部分為 **GPL-3.0**，並需要部署 worker + wasm；不可誤稱整套 DWG 解析皆為 MIT。
- 官方指出 LibreDWG 路徑可能缺少部分實體支援，且 WASM 較大、記憶體較高，大圖可能 OOM；商用解析器不是免費開源替代品。
- 官方示例：https://github.com/mlightcad/cad-simple-viewer-example ，採 lazy-load HTML/PDF/SVG 匯出插件。
- 實際整合前需確認 GPL 授權義務、第三方 notices、Safari 記憶體上限與離線資產部署。**目前尚未建置 DWG 轉檔引擎。**

## 2026-11-03 CAD 程式里程碑
- 已提交 `cad.html`：本機 ASCII DXF→SVG 原型，LINE、CIRCLE、ARC、LWPOLYLINE 的基本幾何子集。
- 未支援圖元會在頁面列出統計；DWG 明確拒絕，避免假轉檔；LWPOLYLINE bulge、BLOCK/INSERT、TEXT、DIMENSION、HATCH、線型等尚不支援。
- 已加入首頁入口及 Service Worker 離線預快取。
- **未通過真實 CAD 圖檔保真驗收，不能當作完整 DXF/DWG 轉換器**；後續需導入 MLightCAD 核心並完成 Safari 測試。

## 2026-11-03 DXF 圓弧增量
- `LWPOLYLINE` 群組碼 42 bulge 已轉 SVG elliptical arc（半徑 = chord × (1+b²)/(4|b|)），包含封閉多段線最後一段。
- 增加弧段 viewBox 保守邊界，避免部分弧段被裁切；SVG 圖層名稱使用 XML attribute escaping。
- 尚缺 OCS/extrusion、複雜 BLOCK/INSERT、HATCH、DIMENSION、文字字型與 DWG WASM；目前仍屬實驗性子集。
- 參考 Autodesk DXF LWPOLYLINE 規格：https://help.autodesk.com/cloudhelp/2017/ENU/AutoCAD-DXF/files/GUID-748FC305-F3F2-4F74-825A-61F04D757A50.htm

## 2026-11-03 CAD 幾何防呆
- `cad.html` 已避免將隱藏圖元 (60)、圖紙空間圖元 (67)、非零厚度 (39)、非零高程 (38/30/31) 錯誤投影為平面模型空間 SVG。
- 零掃掠角 ARC 會略過並計入 skipped 統計；目前不是完整 AutoCAD 圖形輸出。
- 待辦：處理 OCS/WCS、BLOCK/INSERT、文字/字型、尺寸、HATCH、DXF 轉 PNG/PDF，以及 DWG WASM 解析與保真測試。

## P0 最終驗收目標（2026-11-03 使用者指定）
**DWG → PDF（使用者輸入 dpf，依上下文視為 PDF）**。此項為首要交付與通過門檻，其他格式不構成完成。

### 驗收流程（全部通過才可宣稱完成）
1. iPhone Safari / 已安裝 PWA 選取實際 .dwg；不依賴雲端轉檔、不上傳圖紙，斷網後能重複操作。
2. 真正解析 DWG 原生資料，顯示版本、圖層、模型空間；不以副檔名更改、截圖冒充轉換。
3. 產生可下載且可開啟的 **.pdf**；頁面尺寸、方向、圖面範圍及縮放規則明確；無法取得原始單位時提示而非臆測。
4. 使用至少兩份含 LINE、ARC、LWPOLYLINE、CIRCLE、BLOCK/INSERT、TEXT/MTEXT、DIMENSION、HATCH 的真實 DWG 驗證；逐類比對圖元數、缺漏、中文文字、圖層可見性及比例。
5. 對不支援圖元、缺字型、XREF、代理物件明確警示，不得靜默丟失；PDF 檢查頁數、尺寸及能否開啟。
6. 記錄 iPhone Safari 測試、檔案大小、耗時、記憶體失敗、離線重啟結果；附 commit、測試檔與可重現操作步驟。

### 開發順序
P0a 導入可離線執行的 DWG WASM 解析器（含授權）→ P0b 幾何/圖層/字型/塊處理 → P0c PDF 向量輸出與版面設定 → P0d 實機保真驗收。DXF→SVG 目前只是輔助原型，不能抵銷 P0 未完成。

## 2026-11-03 P0 DWG→PDF 開始整合（原始碼已提交，尚未建置/部署）
- 新增獨立 `cad-full/` Vite 專案：`package.json`、`vite.config.ts`、`index.html`、`src/main.ts`。
- 採 MLightCAD viewer 1.6.0 + data-model 1.13.0 + LibreDWG GPL-3.0 converter ^3.13.0 + PDF plugin 1.6.0。
- `main.ts` 註冊 DWG converter、檢查 worker、載入本機 DWG/DXF、PDF `cpdf` 命令；`vite.config.ts` 同源複製 MTEXT worker、LibreDWG worker、WASM。
- **現有 GitHub Pages 首頁仍只提供 `cad.html` DXF→SVG 實驗版；`cad-full/` 尚未經 npm install、Vite build、Safari 實測或部署。不能稱 DWG→PDF 已可用。**
- 待辦：安裝依賴並核對 package API、執行 build、產出 dist、將 dist 放入 Pages 可訪問路徑、處理 Service Worker 預快取及 GPL 授權告知，最後使用真實 DWG 驗收。
- 官方實作參考：https://github.com/mlightcad/cad-simple-viewer-example （尤其 src/registerLibreDwg.ts、src/register.ts、vite.config.ts）。

### 2026-11-03 批次修正與測試限制
- `cad-full/src/main.ts`：檢查 DWG AC10xx 標頭、避免同時重複開檔、使用 PDF 外掛文件所列 `-cpdf` 命令。
- `cad-full/package.json`：正式 build 先執行 TypeScript 檢查；新增 `tsconfig.json`。
- 官方範例確認 `-cpdf` 是無 UI 的命令列 PDF 匯出；`cpdf` 在完整 UI 可能開啟對話框。來源：https://github.com/mlightcad/cad-viewer/blob/main/packages/cad-pdf-plugin/README.md
- **驗證阻塞：**此執行環境 `npm view` 無法在逾時內取得 npm registry 回應，因此尚未安裝依賴，也未實際完成 `tsc`、Vite build、WASM 載入、PDF 生成與 iPhone 離線驗收。不可將原始碼提交當成轉檔成功。
- 下一批優先：取得可用 Node/npm 建置環境，檢查實際 API/相依版本與 TS 錯誤，打包 Worker+WASM、部署並進行真實 DWG PDF 測試。

### 2026-11-03 DWG→PDF 批次修正（第二批）
- 依官方 PDF 外掛文件修正為 `AcApDocManager.instance.editor.executeCommand('-cpdf')`，並捕捉非同步錯誤；原先 `sendStringToExecute` 並非文件所列 API。
- 抽出 `cad-full/src/file-validation.ts`，檢查 DWG AC10xx、ASCII/Binary DXF 標頭、空檔與不支援副檔名。
- 新增 `cad-full/tests/file-validation.test.mjs` 七項零依賴測試，`npm run build` 先跑測試與 TypeScript 檢查再執行 Vite。
- 本次在執行環境確認 Node v22.16.0 / npm 10.9.2，但 `registry.npmjs.org` DNS 回傳 `EAI_AGAIN`；**測試腳本尚未在 GitHub checkout 執行、套件未安裝、Vite 未建置、DWG→PDF 未驗收**。
- 待處理：核對 MLightCAD 套件版本、Worker/WASM 複製路徑與 PDF 外掛實際型別，建置後在 iPhone 飛航模式驗證 PDF 可開啟與圖元保真。

### npm 多備援（2026-11-03）
- `cad-full/scripts/npm-failover.mjs` 依序嘗試 npm 官方、Yarn、npmmirror、華為雲 Registry。每個來源先執行 `npm ping`，再執行 `npm install`；任一步失敗會嘗試下一來源，全部失敗則以非零結束碼回報。
- `cd cad-full && npm run deps:check`：檢查可用 Registry；`npm run deps:install`：多備援安裝；有 lockfile 後可用 `npm run deps:ci`。
- 每次嘗試設 45 秒上限、較短 npm 網路逾時，避免單一 Registry 卡住整批工作；不修改使用者全域 npm 設定。
- 安全性：不關閉 TLS 驗證；正式建置固定版本並提交 package-lock.json，核對 integrity。鏡像可能不同步或套件不存在；切換來源無法解決全面 DNS 故障。
- **此批已提交程式，但未在可存取 npm Registry 的 checkout 中執行完整安裝/建置。**

### 2026-11-03 npm 備援增強
- 安裝流程增加 `package-lock.json` 存在時優先嘗試 `npm ci --offline`（本機 npm 快取）；失敗才走官方→Yarn→npmmirror→華為雲 Registry。
- `deps:ci` 在缺少 lockfile 時立即失敗，避免誤以為完成可重現安裝。npm 文件說明 `npm ci` 必須依賴 lockfile，且 npm 的 `replace-registry-host=npmjs` 可將官方 lockfile URL 對應至目前 Registry。參考：https://docs.npmjs.com/cli/using-npm/config/ 、https://docs.npmjs.com/cli/commands/npm-ci
- 安裝時不禁用 TLS 驗證，維持 lockfile integrity 檢查；網域全部無法解析時，不應宣稱鏡像已解決 DNS 問題。
- **尚未在可連網 checkout 完成 npm 安裝、Vite build、DWG→PDF 匯出與 iPhone 離線驗收。**

### 2026-11-03 DWG→PDF 離線發行檢查
- 依 MLightCAD `cad-simple-viewer-example` 最新 README，PDF 外掛由 `AcApDocManager.instance.sendStringToExecute('cpdf')` 觸發懶載入；修正先前未驗證的 `editor.executeCommand('-cpdf')` 呼叫。
- 新增 `cad-full/scripts/check-dist.mjs`：建置完成後檢查 HTML、MTEXT Worker、LibreDWG Worker、LibreDWG WASM 與 JavaScript bundle 非空；缺少必備資產會讓 build 失敗。
- `npm run build` 已串接測試、TypeScript、Vite 與離線資產 smoke check。**這只是靜態檢查，無法證明 iPhone Safari 可解析 DWG 或產生正確 PDF。**
- 官方參考：https://github.com/mlightcad/cad-simple-viewer-example 及 https://github.com/mlightcad/cad-viewer/blob/main/packages/cad-pdf-plugin/README.md
- 仍需：成功安裝套件、實際執行 build、部署 Pages、飛航模式實機 DWG→PDF 測試及 PDF 保真比對。

### 2026-11-03 離線 DWG/PDF 靜態資產批次整合
- `cad-full/vite.config.ts` 對齊官方 `vite-plugin-static-copy` 的 `rename.stripBase` 用法，讓 MTEXT worker、LibreDWG worker 與 wasm 保持同一 `dist/assets/` 層級。
- 新增 `scripts/generate-offline-sw.mjs`：Vite build 後列舉 `dist/` 所有檔案（含動態載入的 PDF chunk），產生 `sw.js` 預快取清單；內容 SHA-256 前綴作為版本鍵，整包超過 150 MiB 則阻擋。`src/main.ts` 註冊同源 service worker。
- `check-dist.mjs` 新增 `sw.js` 與 DWG worker/wasm 預快取檢查。安裝成功後執行 `npm run build` 才會產生真正可離線部署的 `dist/`。
- 風險：Safari 快取容量限制、首次上線必須完整下載後才可離線、PDF 懶載入套件與 Worker 路徑仍須實際瀏覽器驗證。尚未完成 npm 安裝、Vite build、部署或 iPhone DWG→PDF 驗收。
- 依據：https://github.com/mlightcad/cad-simple-viewer-example （官方示範 Vite 靜態複製與懶載入 PDF）。

### 2026-11-03 離線快取回歸測試
- 修正 `generate-offline-sw.mjs`：快取命中只查詢目前版本 `CACHE`，避免意外讀取其他應用或舊版快取；允許 `CAD_DIST_DIR` 指定隔離測試目錄，並要求 `index.html` 存在。
- 新增 `tests/offline-sw.test.mjs` 三項測試：必要資產預快取、內容變更造成版本變更、相同內容版本穩定。`npm run test` 已包含 `tests/*.test.mjs`。
- 這是原始碼與測試案例提交；**尚未在 GitHub checkout 實際執行 Node 測試、npm 安裝或瀏覽器 DWG→PDF 驗收**。下一關鍵步驟仍是可用的建置/部署環境。

### 2026-11-03 PDF 操作防呆與離線測試增補
- PDF 匯出按鈕現在只在成功載入 DWG/DXF 後啟用；換檔立即重置可匯出狀態，避免在錯誤圖面上觸發 PDF。
- UI 明確標示只是觸發 `cpdf`，不宣稱 PDF 已成功下載；匯出按鈕防止同步重複觸發。
- `tests/offline-sw.test.mjs` 增加缺少 `index.html` 應失敗、不可跨快取命名空間讀取等兩項案例。
- 已再次檢查上游 `mlightcad/cad-simple-viewer-example` README：PDF 使用 `sendStringToExecute('cpdf')`，DWG Worker + WASM 需同目錄，Node >=22。來源：https://github.com/mlightcad/cad-simple-viewer-example
- **環境驗證：**Node v22.16.0、npm 10.9.2 存在；目前執行環境 `getent hosts registry.npmjs.org` 無結果，未能取得依賴。測試案例已提交但未執行；仍無 Vite dist 或實機 PDF 驗收證據。

### 2026-11-03 iPhone 本機建置診斷
- 新增 `cad-full/scripts/iphone-diagnostics.sh`：唯讀檢查 a-Shell 的 Node/npm/git/curl/Python、npm Registry 與 MLightCAD 本機快取，不安裝套件、不修改全域設定。
- `cad-full/index.html` 明確區分：一般 PWA 使用者無須 a-Shell；只有自行編譯時才可選擇安裝，且 iOS 端 Node/npm 與 Vite 相容性仍須實機確認。
- 操作：下載專案原始碼至 a-Shell 可讀取的資料夾後，從 `cad-full` 執行 `sh scripts/iphone-diagnostics.sh`。缺少 Node/npm 時改走 Codespaces；有 npm 但無快取時先檢查網路再決定安裝方式。
- 官方參考：https://github.com/holzschu/a-shell 。**此輪未宣稱已在使用者 iPhone 執行診斷、安裝套件或完成 DWG→PDF。**

### 2026-11-03 iPhone npm peerDependencies 驗證
- 使用者於 iPhone a-Shell `npm view` 查得版本：libredwg-converter 3.15.21、cad-simple-viewer 1.7.8、cad-pdf-plugin 1.7.8、data-model 1.15.21；三組 peerDependencies 均要求 data-model 1.15.21，PDF plugin 另要求 viewer 1.7.8。
- `cad-full/package.json` 已更新為上述精確版本，移除未使用且未核實的 cad-simple-ui-plugin；其餘 peer dependencies 交由 npm 安裝並檢查。
- iPhone 下一步：先 `npm install --package-lock-only --ignore-scripts` 驗證依賴樹，再 `npm install` 與 `npm run build`；如有錯誤需保留完整訊息，勿使用 `--force` 或 `--legacy-peer-deps` 掩蓋衝突。
- 此輪未產生 lockfile，也尚未在 iPhone 實際安裝、編譯或完成 DWG→PDF 測試。

### 2026-11-03 lodash-es 安全性修正（待驗證）
- iPhone npm audit 顯示 `lodash-es@4.17.21` 由 `@mlightcad/cad-simple-viewer@1.7.8` 間接引入，三項漏洞（1 high、2 moderate）。
- 使用者於 iPhone npm registry 查得 `lodash-es@4.18.1` 存在；GitHub `cad-full/package.json` 新增 `overrides: { "lodash-es": "4.18.1" }`。
- **尚未驗證**：更新後 npm install/audit、MLightCAD API 相容性及 DWG→PDF；iOS `esbuild` 原生安裝仍不支援，正式 build 應移至 Linux 環境。
- 本機 ZIP 下載的檔案不會自動跟隨 GitHub 更新，須重新下載 main ZIP 才會讀到 overrides；不建議使用 `npm audit fix --force`。

### 2026-11-03 iPhone TypeScript 診斷與修正
- 使用者 iPhone 執行 `node node_modules/typescript/bin/tsc --noEmit` 發現四項錯誤：`AcApOpenDatabaseOptions` 不接受 `readOnly`；三個 Vite static copy target 的 `rename:{stripBase:true}` 型別不符。
- `src/main.ts` 移除 `readOnly`；`vite.config.ts` 改用合法的 `rename` callback 保留原始檔名。
- 此為依錯誤訊息修正，**尚待 iPhone 重新執行 tsc**，不宣稱編譯或 DWG→PDF 已通過。

### 2026-11-03 iPhone a-Shell Node 單元測試通過
- iPhone a-Shell Node 26.12.1 拒絕 `--experimental-strip-types` 與 `--test` 啟動選項，但可直接執行 `node tests/offline-sw.test.mjs`。
- 使用者實測：5 tests、5 pass、0 fail、約 418.5ms；涵蓋離線快取資產、版本雜湊、可重現性、缺失入口與快取隔離。
- `cad-full/package.json` 的 `npm test` 已改成直接執行測試檔，兼容 a-Shell 與一般 Node 環境。
- 尚未執行 Vite 正式 build、檢驗生成的完整 dist、iPhone Safari 飛航模式 DWG→PDF。

### 2026-11-03 Linux Codespaces 正式編譯入口
- 新增 `cad-full/scripts/verify-linux-build.sh`：Linux 平台檢查、npm 安裝與 audit、Node 測試、TypeScript、Vite build、SW/Worker/WASM 產物存在性驗證。
- 在 Codespaces 終端執行：`cd cad-full && bash scripts/verify-linux-build.sh`。未經執行不得宣稱 PASS；成功仍需 Safari 離線 DWG→PDF 實機驗收。
- 使用者已於 iPhone a-Shell 實測 5/5 離線快取測試通過、TypeScript 通過、npm audit 0 漏洞；iOS 原生 esbuild 不支援，改用 Linux 編譯。
- GitHub Codespaces 個人帳戶有免費配額，但不是無限免費；啟用前確認 Billing、預算與剩餘額度。此處未啟動 Codespaces、GitHub Actions 或 Pages 部署。

### 2026-11-03 延後集中驗收（使用者決策）
- 使用者要求暫停 Codespaces / Linux 編譯，先完成其他程式與靜態檢查，之後一次集中驗收；不觸發付費資源或 Actions。
- 已修正網頁進階說明中的無效 `npm cache ls @mlightcad`，並明示 iOS esbuild 限制及離線功能尚未驗收。
- `check-dist.mjs` 加嚴：PDF 命令缺失由 WARN 改為 FAIL，SW 必須同時包含 DWG WASM、DWG Worker、mtext Worker。
- 待集中驗收：Linux npm install/audit/test/tsc/Vite build、完整 dist 靜態檢查、iPhone Safari 飛航模式開啟 DWG、圖面渲染與實際 PDF 輸出；此輪沒有執行上述正式驗收。

### 2026-11-03 離線作用域安全修正（集中驗收前）
- `generate-offline-sw.mjs` 的 fetch handler 從同網域檢查改成 `self.registration.scope` 範圍檢查，避免將同一 GitHub Pages 網域下其他應用資源納入本 CAD PWA 的攔截處理。
- `tests/offline-sw.test.mjs` 增加作用域隔離回歸測試；目前新增測試尚未實際執行，原有 5/5 通過紀錄仍有效。
- 不使用 Codespaces/Actions、不部署；正式 Linux build 與 Safari 離線 DWG→PDF 仍依使用者指示延後集中驗收。

### 2026-11-03 離線準備提示與 PDF 錯誤復原
- `src/main.ts`：載入失敗重置 `documentReady` 並禁用 PDF 按鈕，保留錯誤訊息；PDF 指令成功送出僅提示已啟動流程，**不宣稱 PDF 已產生**。
- `index.html` 與 `src/main.ts`：新增獨立離線狀態欄位；註冊 SW 後檢查目前 origin 之 ConvertX 專用快取是否含 index.html、DWG WASM、DWG Worker、文字 Worker；更新或接管時重新檢查。顯示「核心資產已快取」仍不代表完整功能可離線運作。
- 依使用者指示暫不啟動 Codespaces、Actions 或部署；本輪修改尚待集中執行 TypeScript、單元測試、Vite build 與 Safari DWG→PDF 驗收。

### 2026-11-03 離線安裝失敗清理修正
- Service Worker 預快取安裝程序加入 `try/catch`；資產下載或快取寫入失敗時，先 `caches.delete(CACHE)` 清除該版本未完成快取，再拋出錯誤，使安裝失敗且不宣告成功。
- 新增單元測試檢查產生的 SW 包含安裝失敗清理邏輯；屬靜態回歸測試，不等於瀏覽器故障注入測試。
- 此輪僅更新 GitHub 程式碼，未執行 Codespaces、Actions、Linux build 或 Safari 實機驗收；仍待一次集中檢查。

### 2026-11-03 PWA 更新安全性
- 移除安裝階段強制 `self.skipWaiting()`；避免使用者仍開啟舊版 CAD 工作階段時，新版 Service Worker 立即接管，導致懶載入 JS/WASM 與舊版程式不一致。
- 保留 activate 階段的舊快取清理；新增第 8 項靜態回歸測試，檢查不再強制啟用。
- 參考 Chrome Workbox service worker lifecycle 文件：skipWaiting 可能使舊頁面後續懶載入資源不相容。此修正尚待集中測試。
- 注意：使用者必須關閉舊版頁籤，更新版才能正常接管；未增加任何雲端測試費用。

### 2026-11-03 離線產物完整性檢查
- `cad-full/scripts/check-dist.mjs` 現在解析生成的 `const ASSETS` 清單，逐一比對 dist 實際檔案，禁止漏掉懶載入 JS chunk、PDF 相關資產或包含過時路徑的清單；支援 `CAD_DIST_DIR` 指向測試資料夾。
- `cad-full/tests/offline-sw.test.mjs` 新增第 9 項回歸測試：在生成 SW 後額外新增 JS chunk，要求檢查程式回報 `offline manifest mismatch` 並失敗。
- 此為 GitHub 程式碼更新，未執行正式編譯或新測試；等待集中驗收。零新增 Codespaces/Actions 使用。

### 2026-11-03 靜態驗收健壯性
- `check-dist.mjs`：若 `dist/assets` 不存在，明確回報 FAIL 而非拋出未處理的 ENOENT；另阻止離線清單重複條目。
- `offline-sw.test.mjs`：新增第 10 項測試，模擬缺少整個 assets 資料夾並確認可診斷失敗。
- 此次僅 GitHub 代碼提交，尚未實際執行新增測試、正式建置或 Safari 離線驗收；依使用者要求最後集中檢查。

### 2026-11-04 P0 離線完整性驗證批次（尚待集中執行）
- 現有 UI 僅檢查四項核心檔案即提示已快取，可能漏掉 PDF lazy chunk；修正為建置時產生 `offline-manifest.json`，記錄內容雜湊版本鍵及完整資產清單（含 manifest 自身）。
- `src/main.ts` 依版本鍵開啟指定 CacheStorage，逐項確認所有資產存在後才提示「完整建置資產已快取」；仍不等於實機 PDF 成功。離線時 manifest 透過同源 Service Worker 快取取得；首次安裝失敗不得提示成功。
- `tests/offline-sw.test.mjs` 新增 PDF lazy chunk 被列入清單與重複產生清單穩定性兩項測試。
- 授權：`@mlightcad/libredwg-converter` 的 GPL-3.0 再散布義務仍須於發行前逐項核對 LICENSE、完整對應原始碼取得方式、第三方通知與修改告知；不能以 MIT viewer 掩蓋 DWG GPL 路徑。
- 待驗收：Node 測試、tsc、Vite build、SW 安裝/更新、Safari 飛航模式 DWG→PDF、兩份真實 DWG 保真比對。未啟動 Codespaces/Actions，未部署。
- CadCraft 參考：getcadcraft/cadcraft `app/dwg/read-async.js` 有 JS Worker 失敗回退；storytold/cadcraft `crates/dwg/Cargo.toml` 在 wasm32 排除 acadrust，故不將其桌面 DWG 橋接視為 Safari 可用。兩者皆只作候選，未整合。


### 2026-11-05 離線發行一致性加固（待集中執行）
- `cad-full/scripts/check-dist.mjs`：除了比對 SW 的 ASSETS 與 dist 實際檔案，現在要求 `offline-manifest.json` 存在、可解析，且 `cacheName` 和 `assets` 必須與 SW 完全一致。避免 UI 顯示的快取版本與實際 SW 不同。
- `generate-offline-sw.mjs`：只排除 dist 根目錄的 `sw.js` 與 `offline-manifest.json`；不再意外排除 `assets/*sw.js` 等合法資產。
- `offline-sw.test.mjs`：新增 JSON/SW 不一致失敗、完整發行產物成功、巢狀 *sw.js 納入快取等 3 項回歸案例；合計 15 項測試案例（尚未全部執行）。
- 測試限制：執行環境嘗試從 raw.githubusercontent.com 取得最新檔案時 DNS 無法解析；未在 checkout 中實際執行新測試。沒有觸發 GitHub Actions、Codespaces 或部署。
- 尚未處理的核心阻塞：PDF `cpdf` 目前只有命令啟動狀態，缺少可驗證的輸出 PDF 位元組、頁面/比例設定與真實 DWG 保真比對；不能將離線快取通過視為 DWG→PDF 驗收通過。

### 2026-11-06 P0 測試入口修正與 PDF 上游 API 查核
- 發現 `cad-full/package.json` 的 `npm test` 只執行 `offline-sw.test.mjs`，遺漏已存在的 `file-validation.test.mjs`（7 項 DWG/DXF 檔頭檢查）。改為 `scripts/run-tests.mjs` 自動列舉 `tests/*.test.mjs` 並逐檔執行，任一檔失敗即讓 build 失敗；避免依賴 iPhone a-Shell 不支援的 `node --test` 啟動旗標。
- 新增離線資產清單重複條目回歸案例；`offline-sw.test.mjs` 共 16 項，`file-validation.test.mjs` 7 項，**總共 23 項已提交測試案例，非 23 項已通過**。
- 2026-11-06 查核上游 `mlightcad/cad-viewer/packages/cad-pdf-plugin/README.md`：`-cpdf` 為命令列提示式匯出，`cpdf` 在無 UI 時為相同功能；上游另提供 `AcApPdfConvertor`、`resolveAcApPdfExportOptions`，並透過 `@mlightcad/pdf-renderer` 產生 PDF 位元組。現有 `sendStringToExecute('cpdf')` 僅能確認指令已排入佇列，**不能驗證 PDF 已產生**。後續優先改為可檢查位元組的轉換流程，但需先確認實際套件型別、context/database 取得方式，避免盲改。
- 依據：https://github.com/mlightcad/cad-viewer/blob/main/packages/cad-pdf-plugin/README.md ；https://www.npmjs.com/package/@mlightcad/pdf-renderer
- 執行環境 `git ls-remote` 無法解析 `github.com` DNS，無法下載 checkout 進行實際 Node 測試；以上修改已由 GitHub connector 提交，**尚未執行新增測試、Linux Vite build、兩份真實 DWG 保真比對或 iPhone 飛航模式 DWG→PDF 驗收**。
- 重要授權閘門維持：LibreDWG GPL-3.0 對應原始碼、著作權與 LICENSE/NOTICE 檔案，必須在 Pages 發行前確認；不得以 PDF plugin MIT 授權替代 DWG 解析器 GPL 義務。

### 2026-11-07 DWG 單位與版本保守預檢（未完成 PDF 保真）
- 新增 `cad-full/src/dwg-preflight.mjs`：識別已知 AC10xx 版本；未知版本保留未知，不以標頭推論 INSUNITS、圖層、XREF、字型、BLOCK/INSERT、尺寸或 HATCH 完整性。
- `main.ts` 載入後顯示版本與圖元/外部參照警示；`index.html` 提供預設「未知／未核對」的人工單位選擇；PDF 指令前明示**選擇單位尚未套用至輸出比例**，不得視為可量測工程圖。
- 新增 `tests/dwg-preflight.test.mjs` 六項測試案例，依現有 `run-tests.mjs` 自動納入；新案例尚未在 GitHub checkout 內完整執行。於隔離 Node 環境重建同邏輯進行 5 項 smoke assertions 成功，但**不等於 GitHub 原檔測試、TypeScript、Vite 或 Safari 通過**。
- 授權發行門檻：LibreDWG GPL-3.0 路徑須確認實際 npm tarball 內 LICENSE/NOTICE、相依授權、對應原始碼及發行方式；尚未取得完整 tarball，不可標示通過。
- P0 未完成：PDF bytes 可驗證回傳、紙張/比例真實控制、兩份真實 DWG 比對、iPhone Safari/PWA 飛航模式下載 PDF。
- 本批未啟動 Codespaces、Actions 或部署，未變更其他 repo/排程。

### 2026-11-08 PDF 基本位元組檢查（尚非 DWG→PDF 驗收）
- 新增 `src/pdf-audit.mjs`：僅檢查 PDF 版本檔頭、最小長度、結尾 EOF；不代表頁數、MediaBox、字型、向量保真或實際可開啟。
- 新增 `tests/pdf-audit.test.mjs` 五項案例，並於 `index.html`、`src/main.ts` 加入手動選取 PDF 的基本檢查入口。此入口不能證明該 PDF 來自當前 DWG。
- 查閱上游 `mlightcad/cad-viewer/packages/cad-pdf-plugin/src/AcApPdfConvertor.ts`：目前上游使用 `acexPdfExportDatabase` 取得 Uint8Array 再下載，但尚未核對本專案固定的 1.7.8 版 API，故暫不直接取代 `cpdf`。
- 新增測試未在完整 checkout 執行；GPL 授權發行查核、PDF 頁面尺寸與比例、兩份真實 DWG 比對及 iPhone Safari 飛航模式驗收仍未完成。未使用 Actions、Codespaces 或部署。

### 2026-11-08 離線清單防護補強（本輪）
- `cad-full/src/main.ts` 離線狀態檢查新增資產路徑白名單、拒絕 `..` / 雙斜線、重複項目，並要求 `index.html` 與 LibreDWG worker 存在；保留建置清單必要的 `./` 根路徑。
- 此修正只提高「快取完整」提示的可信度，**不是** DWG 解析或 PDF 匯出通過的證據。
- 本輪未在完整 checkout 執行 npm test / tsc / Vite build，未測試真實 DWG 或 iPhone 飛航模式；測試狀態維持未驗收。
- 後續首要阻塞：在可用 Linux 建置環境取得固定依賴與 PDF 外掛實際匯出位元組，接上可驗證頁面尺寸/比例，再做兩份真實 DWG 比對。

### 2026-11-08 PDF 指令非同步失敗處理
- `cad-full/src/main.ts` 將 PDF 匯出事件改為 async，等待 `sendStringToExecute('cpdf')` 的同步或 Promise 錯誤，避免忽略非同步指令失敗。
- 訊息區分「指令已送出」與「PDF 位元組、尺寸、下載已驗證」，後者仍未達成。若上游命令只排程而不等待匯出完成，鎖仍不能代表整個 PDF 對話框生命週期。
- 新增 `tests/pdf-dispatch.test.mjs` 兩項靜態回歸案例；尚未在完整 checkout 執行，不宣稱通過。
- 下一步驗證 1.7.8 PDF 外掛直接回傳位元組、頁面/比例輸出及實機真實 DWG。

### 2026-11-09 同源離線攔截修正與上游 PDF API 查核
- `cad-full/scripts/generate-offline-sw.mjs`：Service Worker fetch handler 同時要求 `new URL(request.url).origin === self.location.origin` 與 registration scope，避免跨來源字串前綴誤判；更新既有測試並新增跨來源案例。
- 上游 `mlightcad/cad-viewer` PDF README 指出 `AcApPdfConvertor` 可程式化呼叫、向量 PDF 可包含 model/paper-space，但 README 主線不等於本專案固定 1.7.8 npm tarball API；本輪不盲目改用未核對型別的介面。1.8.0 起另拆 `cad-pdf-core`/`cad-pdf-exporter`，需避免將 1.8 API 誤套至 1.7.8。
- 驗證：嘗試 `git ls-remote`，執行環境仍無法解析 github.com；未在 checkout 執行測試/tsc/Vite。新增測試為已提交、未通過驗證。
- P0 仍阻塞：取得 1.7.8 可用 PDF bytes API、GPL 對應原始碼/NOTICE、真實 DWG 保真與 Safari 飛航模式。

### 2026-11-10 GPL 發行阻擋閘門（未完成授權審核）
- `cad-full/scripts/check-dist.mjs` 新增 `CAD_RELEASE=1` 發行模式：dist 必須有非空的 `legal/GPL-3.0.txt` 與 `legal/DWG-SOURCE.md`，否則檢查失敗。一般開發 smoke check 不受此閘門影響。
- `cad-full/tests/license-release.test.mjs` 新增兩項案例，分別檢查發行缺件阻擋與開發模式不誤擋；尚未於完整 checkout 執行。
- **重要：這兩份文件必須取自核對過的 LibreDWG 實際套件授權與對應原始碼，不得填入虛構文字來通過檢查。** 僅有檔案存在亦不等於 GPL 合規；還須人工查核 LICENSE/NOTICE、相依套件、修改內容及取得源碼方式。正式發行應執行 `CAD_RELEASE=1 npm run check:dist`。
- 上游 PDF 文件提及程式化 `AcApPdfConvertor` 與向量 PDF；但固定版 1.7.8 的 API/建置與 Safari 實測仍未確認，不能宣稱已可控制紙張或取得 PDF bytes。
- 尚未完成 Node 全套測試、Vite build、兩份真實 DWG、iPhone 飛航模式；P0 DWG→PDF 未驗收。

### 2026-11-11 固定版本 PDF 實作查證與 GPL 發行閘門加固
- 直接讀取 `mlightcad/cad-viewer` GitHub tag `v1.7.8` 的 `packages/cad-pdf-plugin/src/AcApPdfConvertor.ts`，確認此版本 `AcApPdfConvertor.convert(context, options)` 透過 `@mlightcad/pdf-renderer` 的 `exportDatabaseToPdf(db, pdfOptions)` 取得 Uint8Array，隨後在內部觸發 Blob 下載；其 `convert()` **不回傳 PDF bytes**。若要讓 ConvertX 驗證實際 bytes，需另走 `exportDatabaseToPdf` 並取得有效 `AcDbDatabase`、PDF options 與字型解析依賴，不能把 `convert()` 的 Promise 當作 PDF 位元組。
- 上游 v1.7.8 的 `modelSpaceFit` 為 extents/display，`exportLayouts` 控制模型/圖紙空間；此版本的程式並未直接證明 A4/A3 或 1:N 比例已可指定。保留 UI 的比例未驗證警示。
- `cad-full/scripts/check-dist.mjs` 在 `CAD_RELEASE=1` 時不只檢查 GPL 檔案存在，另檢查 GPLv3 標頭、合理最小文字長度及 LibreDWG 3.15.21 對應源碼說明的基本內容；仍需人工審核實際套件與再散布義務。
- `cad-full/tests/license-release.test.mjs` 更新舊錯誤訊息預期並新增佔位授權文字拒絕案例；尚未在完整 checkout 執行，不宣稱測試通過。
- 固定版原始碼：https://github.com/mlightcad/cad-viewer/blob/v1.7.8/packages/cad-pdf-plugin/src/AcApPdfConvertor.ts
- 下一關鍵任務：確認 PDF renderer 固定版直接 API 與資料庫取得方式、完成真正向量 PDF bytes 匯出及紙張比例驗證；再做兩份 DWG 與 Safari 飛航模式。

### 2026-11-12 P0 原生 PDF 位元組輸出首次接線（尚待建置與真機驗證）
- 依 `mlightcad/cad-viewer` **v1.7.8** 的 `AcApPdfConvertor.ts` 查核，使用 `AcApDocManager.instance.context.doc.database` 和 `@mlightcad/pdf-renderer` 的 `exportDatabaseToPdf`；固定 `@mlightcad/pdf-renderer` 為 `1.7.8`，與 viewer/plugin 相同版本。改以直接產生 PDF bytes、`inspectPdfBytes` 檢查、Blob 下載，取代僅派送 `cpdf` 命令。
- 現階段 `fit:'extents'`、`layouts:'current'`，未提供紙張尺寸、1:N 比例或字型解析器；不可視為工程比例正確。PDF bytes 基本檢查不等於圖元保真、瀏覽器下載成功或完整 PDF 解析。
- 更新 `pdf-dispatch.test.mjs` 為 4 項靜態回歸測試，覆蓋資料庫來源、bytes 檢查、警示及版本一致性。尚未在完整 checkout 執行 npm test、TypeScript、Vite build；`git ls-remote` 本次仍因 github.com DNS 無法解析。GitHub 連接器提交成功，但不等於建置成功。
- 仍須核對 `pdf-renderer` 1.7.8 實際 npm 發行與型別、GPL 發行對應源碼、DWG 圖層/BLOCK/TEXT/HATCH/XREF、兩份真實 DWG 及 Safari 飛航模式。未部署、未觸發 Actions 或付費服務。
- 依據：https://github.com/mlightcad/cad-viewer/blob/v1.7.8/packages/cad-pdf-plugin/src/AcApPdfConvertor.ts

### 2026-11-12 PDF 下載檔名修正（仍未完成驗收）
- 修正 `main.ts` 匯出 PDF 檔名的正規表示式：原本 `/\\\\.(dwg|dxf)$/i` 會錯誤匹配反斜線而非副檔名，現改為 `/\\.(dwg|dxf)$/i`；避免 `drawing.dwg.pdf` 等錯誤檔名。
- 新增 PDF 檔名靜態回歸案例，涵蓋大寫副檔名與含多個點的檔名；尚未在完整 checkout 執行。
- 本執行環境 `git ls-remote` 因 GitHub DNS 失敗，Node/npm 可用但未取得完整依賴，因此未執行 tsc/Vite build、真實 DWG、Safari 飛航模式。GitHub connector 提交不等於功能驗收。
- 核心阻塞：固定版本 renderer 型別/建置驗證、頁面尺寸/比例、字型與 XREF、至少兩份真實 DWG、iPhone 實機下載與 GPL 對應原始碼。

### 2026-11-12 首次完整 Linux 建置與 PDF Renderer 位元組測試
- 從 GitHub 最新 `main` HEAD `9ee7a2b65fc2e1a92048f9c1dd34d5a4ddbee115` checkout；使用 Node `v24.22.1`、npm `11.9.0`。依賴可從 npm registry 安裝，建立並提交 `package-lock.json`，Vite、TypeScript、static-copy 等建置工具改為鎖定實際版本。
- 修正一項離線測試：先前錯誤要求 Service Worker 不檢查來源 origin，與現有安全實作相反。測試改為確保同源限制存在。
- TypeScript 首次檢查發現 PDF audit 與 DWG preflight 的 `.mjs` 缺型別宣告；新增 `.d.mts` 型別介面。
- 修正 `vite-plugin-static-copy` 的目標路徑：原設定未移除 `node_modules/...` 路徑，使 Worker/WASM 實際輸出位置與程式要求的 `assets/` 不符。現以 `rename.stripBase` 平鋪至 `dist/assets/`，離線發行 smoke check 全數找到。
- Renderer API 1.7.8 支援 `paper: {widthMm,heightMm}`。新增 A4/A3 與直/橫向選項並傳入實際毫米尺寸；兩項新整合測試使用原生 renderer 建立真 PDF 位元組、驗證 `%PDF-1.7`、EOF、向量線段以及 A4/A3 MediaBox。這是合成線段 smoke test，**不是任何真實 DWG 保真測試**。
- 驗證結果：`npm test` 46 項通過；`tsc --noEmit` 通過；`vite build` 通過；`check:dist` 通過。另以 `npm ci` 重現安裝成功。靜態離線包 6 個檔案，約 21.4 MB；其中應用 JS 約 5.5 MB、懶載 PDF plugin 約 3.4 MB、WASM 約 10.9 MB，需在 iPhone 實機評估首次離線快取時間與記憶體。Vite 對大 chunk 發出非阻擋警告。
- GPL 查核：實際安裝的 `@mlightcad/libredwg-converter@3.15.21` 與其 `@mlightcad/libredwg-web@0.8.3` 均標示 GPL-3.0；已確認 converter tarball 含完整 GPLv3 LICENSE，libredwg-web 來源對應 tag `v0.8.3` 指向 commit `b5177613f2c735858a6d1cb1d1c7e238c397b88f`。仍未確認 converter 3.15.21 的完整對應源碼提交、所有 transitive notices 和 GPL 發行方案；release gate 未通過，沒有部署。
- 尚未完成：至少兩份真實 DWG（目前無測試圖檔）、圖層/模型空間/BLOCK/INSERT/TEXT/MTEXT/DIMENSION/HATCH/XREF/字型逐類比對、1:N 工程比例（目前只有範圍符合紙張）、PDF 閱讀器完整解析與列印比例核對、GitHub Pages 發布、iPhone Safari/PWA 飛航模式下載驗收。不能宣稱 P0 完成。

### 2026-11-12 本機真實 DWG 樣本解析批次（未完成視覺保真比對）
- 從 MLightCAD 公開 `cad-data` commit `6c546f569cca6ff0b8b3f6fc8aa22dada90e7779` 取得 `baseline-sample.dwg`、`canteen.dwg`，只放在本機 `/tmp` 測試；未將 DWG 或 PDF 樣本加入 GitHub 專案。SHA-256：baseline `4a8e5195e600ac8f6b4e37869cac812fe54c5359b4b97ca19e27ad57422ddc64`；canteen `818f54cd3b413ce3ab00a6aa849bc29cd8cc8581a39fc31a723691f40141fdbc`。
- 新增 `cad-full/scripts/verify-real-dwg.mjs` 與 `npm run verify:dwg -- <本機 DWG...>`。它用固定版 LibreDWG WASM 解析本機樣本，再讓固定版 MLightCAD converter 執行資料庫實體化，最後輸出 A4 向量 PDF 並列出來源圖元類型、圖層/區塊數、轉換錯誤與 PDF 位元組。此 Node harness 注入已由 WASM 解析的模型，**不會執行瀏覽器 GPL Worker**，不等同 Safari Worker 實測；輸入只留在本機，輸出預設寫入忽略目錄 `.local-dwg-validation/`。
- `baseline-sample.dwg`（81,659 B，AC1032，來源 INSUNITS=4，21 圖層、12 區塊）：解析 170 個跨圖紙空間的實體、0 個 LibreDWG unknown entity；模型空間轉換 165 個；輸出 PDF 約 18.7 kB。`pdfinfo` 確認 1 頁、A4、未加密。含 TEXT、MTEXT、INSERT、HATCH、LINE、ARC、CIRCLE 等。
- `canteen.dwg`（2,618,816 B，AC1021，來源 INSUNITS=4，14 圖層、110 區塊）：解析 25,125 個實體、0 個 LibreDWG unknown entity；型別包含 DIMENSION 28、INSERT 690、HATCH 274、LINE 22,835、MTEXT 188、TEXT 106、3DSOLID 1、VIEWPORT 2。模型空間轉換 25,122 個實體、conversionErrors 為空；輸出 PDF 約 788 kB。`pdfinfo` 確認 1 頁、A4、未加密。
- 新增 UI 預檢摘要：顯示實際模型空間圖元數、型別計數、圖層數與可識別 XREF 區塊；加入固定保真警示，明確指出字型/SHX 提供器未設定、XREF 未載入/核對、不支援與代理物件可能缺漏。單位選擇也明確顯示尚未套用至 PDF 比例。
- 用 LibreDWG 內嵌的低解析 DWG 縮圖和輸出 PDF 做了第一次視覺對照：整體多區塊排布相似，但 PDF 的測試 harness 沒有字型／glyph provider，文字標註消失。固定版 `cad-pdf-plugin` v1.7.8 有 viewer glyph provider 與字型解析器；已接入應用匯出路徑，設為字型目錄解析、SHX 向量回退，並加 1 項接線回歸測試。此為代碼接線，**接線後尚未重新在瀏覽器用這兩份真 DWG 產生 PDF 做視覺驗收**；SHX 或缺失字型仍可能缺字。
- 新增 3 項警示回歸測試與 1 項 glyph/font 接線測試；本批完整 `npm test` 為 50 項全過；TypeScript、Vite 與離線資產檢查通過。**目前仍未用獨立 CAD 應用逐圖元視覺比對 PDF**；LibreDWG `unknownEntityCount=0` 僅表示 parser 沒有標成未知類型，不證明 renderer 支援全部實體。Text/SHX、OLE2FRAME、MULTILEADER、WIPEOUT、3DSOLID、XREF、代理物件仍要逐項核對。
- 未完成：A4/A3 的每一種方向 PDF bytes MediaBox 雖有合成線條測試，但真 DWG 只測 A4 直向；1:N 工程比例、單位套用、逐圖元視覺比對、Safari Worker、iPhone 真機離線下載、GPL 對應源碼與發行義務仍未驗收。

### 2026-11-12 明確單位與 1:N PDF 比例控制（待真圖與真機核驗）
- `cad-full/src/pdf-scale.mjs` 新增 1:N fit-box 計算：只有人工選定毫米/公分/公尺/英吋/英尺後才啟用；依 A4/A3、方向、10 mm 邊界與 renderer 的 2% 內距，計算置中的模型空間 fit box。若模型範圍放不進選定紙張則拒絕匯出，不自動縮小比例或裁切。
- `main.ts` 匯出時只在建立 renderer 的同步階段暫時套用人工選定的 INSUNITS，立即還原原資料庫欄位；1:N 模式傳入 fitBox，依圖面配紙模式仍不聲稱工程比例。單位未知且選 1:N 時明確失敗。
- UI 增加依範圍配紙及 1:1 至 1:1000 比例選項。新測試覆蓋單位碼映射、1:50 預期尺度、置中、超出紙張拒絕與未知單位拒絕。
- 驗證：`npm test` 九個測試檔通過；TypeScript 通過；Vite build 通過；離線清單 7 檔、21,381,944 bytes；`check:dist` 通過。Vite 有大 bundle 非阻擋警告。測試的比例為數學 fit-box 測試，尚未用真 DWG 及 PDF 讀取器核對列印實際尺寸。
- 仍未完成：真實 DWG 重新輸出各比例 PDF、PDF 列印尺規獨立核對、兩份 DWG 文字/尺寸/HATCH/BLOCK 視覺比對、GPL 對應源碼與完整 notices、Pages 部署、Safari/PWA 飛航模式下載驗收。LibreDWG 上游也明列其仍有缺少支援/測試覆蓋的 DWG entity 類型，因此 parser 不標記 unknown 不能替代逐圖元驗證。來源：https://github.com/LibreDWG/libredwg 及 https://www.gnu.org/software/libredwg/manual/LibreDWG.html

### 2026-11-12 iPhone 測試頁窄螢幕版面修正
- 依使用者 iPhone Safari 截圖調整 `cad-full/index.html`：表單改窄螢幕雙欄／超窄單欄、檔案與 PDF 按鈕全寬、加入瀏海安全邊距、限制水平溢出；保真限制改可收合，預覽高度改用動態視窗比例。
- TypeScript、Vite build、離線 manifest 與 `check:dist` 通過；Vite 仍有大型 chunk 警告。尚未在使用者 iPhone 更新頁面後複驗顯示；DWG/PDF 與離線驗收狀態不變。
