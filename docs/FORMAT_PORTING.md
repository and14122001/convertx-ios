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
