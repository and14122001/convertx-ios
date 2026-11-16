# ConvertX DWG→PDF 開源架構整合決策（2026-11-16）

## P0 結論
維持現有 `LibreDWG WASM → MLightCAD database → pdf-renderer → pdf-lib 組版 → PDF Blob` 主線。不得直接把另一套檢視器的 Canvas/WebGL 畫面當向量 PDF，亦不得因 README 宣稱功能即認定保真。所有候選先做 API、授權、WASM/Worker 同源、iOS Safari 與實際 DWG 比對。

| 候選 | 實際公開架構 | 可重用方向 | 限制／決策 |
| --- | --- | --- | --- |
| gokbilge/cadflux | MLightCAD + LibreDWG，模型空間／布局 PDF、紙張／比例／批次 | 比對 PDF 參數、布局、固定比例、批次測試 | GPL-3.0-or-later；與現有底層重疊，先差異分析，不整套移植 |
| flyfish-dev/cad-viewer | LibreDWG WASM Worker → CadDocument → WebGL/Canvas | SHX 外部參照生命週期、缺失字形提示、INSERT/UCS、線型比例與 ACI 色彩測試 | AGPL-3.0-only；WebGL/Canvas 不等於可直接輸出 CAD 向量 PDF；先參考測試，不引入依賴 |
| MLightCAD v1.7.8（目前） | LibreDWG converter → data-model → PDF renderer | 保留可追溯的 CAD 圖元 PDF 管線 | 缺 glyphProvider、PDF 圖層與圖元保真未驗證；優先修復 |
| MLightCAD 1.8+ | 上游提供 headless PDF exporter | 評估整套版本升級是否改善字型與布局 | 不混用跨版 API；需 lockfile、完整 build、授權核對 |

## 逐層整合接口
1. **DWG parser**：只由本機 File/ArrayBuffer 送入同源 Worker/WASM；回報版本、解析警告、未支援物件、XREF、單位未知狀態。不得以預設毫米冒充已確認工程單位。
2. **CAD database**：檢查 model/paper space、圖層可見性、BLOCK/INSERT 與嵌套、TEXT/MTEXT/SHAPE、DIMENSION、HATCH；建立每份 DWG 的圖元數量／缺失清單，無法核實的標示未知。
3. **字型／外部參照**：參考 flyfish 的缺失 SHX、手動提供 File/ArrayBuffer、重新建立圖元路徑；不能以系統 fallback 字型宣稱字形保真。XREF 不自動上傳或網路抓取。
4. **PDF renderer**：比對 CadFlux 的模型／布局、紙張、方向、固定比例及黑白輸出；現有 Form XObject 智慧組版不保證 OCG 可切換圖層或 1:N 比例，需獨立測試。
5. **離線部署**：GitHub Pages 同源 worker、WASM、字型及 PDF chunks 全列入 manifest；在 iPhone Safari 飛航模式載入、解析、匯出、下載並重新開啟 PDF。
6. **授權**：LibreDWG GPL-3.0-or-later、CadFlux GPL-3.0-or-later、flyfish AGPL-3.0-only、MLightCAD 各套件原授權須逐檔核對；未完成相容性及對應原始碼發行義務核查前不複製其程式碼。

## 不可跳過的驗收證據
- 兩份以上可合法使用的真實 DWG，保存來源／雜湊／版本、解析警告、圖元統計及參考 App 匯出的 PDF。
- 比對圖層、模型／布局、BLOCK/INSERT、文字字形、尺寸、HATCH、線型、線寬、顏色及 MediaBox；記錄差異而非只檢查 PDF 檔頭。
- Node 測試、TypeScript、Vite、同源離線資產與 iPhone Safari 飛航模式下載實測。缺一項不得宣稱完成。

## 已查證來源
- https://github.com/gokbilge/cadflux
- https://github.com/flyfish-dev/cad-viewer
- https://github.com/flyfish-dev/cad-viewer/releases
- https://github.com/mlightcad/cad-viewer

**本文件為架構稽核及整合閘門，不代表候選程式碼已被移植，也不代表 DWG→PDF 驗收通過。**

## 2026-11-16 實際 checkout 比對（取代僅 README 判斷）

| 專案／固定 SHA | 實讀程式 | 實際結論 |
|---|---|---|
| CadFlux `4efa6712040d0ff2486e3c61f1766ce627fc67c8` | `packages/renderer-pdf/src/node.ts` | 目前另有 `DrawingDocument → jsPDF` 的 Node 向量輸出；依賴 `node:fs/promises`、內建 A0–A4，文字使用 `pdf.text`。不能直接當成 Safari/SHX 保真替代，先不移植。GPL-3.0-or-later。 |
| flyfish `0ce90d08bbf96aa780676ffeb81e0da12c575097` | `src/loaders/dwg/DwgLoader.ts`、`src/core/shx.ts` | 預設僅允許 DWG Worker 路徑，暴露 preload/terminateWorker 與自訂 workerUrl/workerFactory；非現有 PDF 管線的直接替代。AGPL-3.0-only，不複製程式。 |
| MLightCAD v1.7.8 `c6c14f90e46bedbe9d6e6cf7faa7851d3f3490ad` | `AcApPdfConvertor.ts`、`AcApPdfGlyphProvider.ts`、`AcApFontUtil.ts`、`AcApDocManager.ts` | glyph factory 未公開 export，採 MIT 原始碼移植並保留授權；加上失敗回報，分離字形幾何以實測變換／顏色／SHX 線段。`AcApFontUtil.cacheFont` 為公開本機字型 API。 |

- 上游 viewer 預設 `baseUrl` 指向 jsDelivr cad-data，會下載字型。ConvertX 已覆寫為同源，部署空字型目錄並讓使用者載入有權使用的原圖字型；不將不明授權的 cad-data 字型重發。
- 未升級到 1.8+、未替換 PDF 幾何模組。未知 SHX 編碼維持未指定，不自動推定 Big5/GBK。
- 本批文字 API／型別／bundle 建置通過，字形幾何單元測試通過；真實中文字形與 Safari 字型快取仍未驗收。

## 2026-11-16 原始工程圖實測後的架構修正

- 使用者提供的 DWG 僅在工作環境本機讀取；未加入 Git、未送第三方轉換服務。SHA256 `7342ddf877e3cc255e70c48c80d00ecb0e05607e513f1edec545ac72f5a30609`。
- 舊路徑 `parse → BLOCK/DB → preview glyph jobs → export check` 太晚發現不可匯出的字型。新路徑 `Worker parse → STYLE/文字參照預檢 → DB/preview → idle → PDF` 在缺少已知字型時停止於 DB 轉換之前，保留既有幾何與向量 PDF 模組，無重複解析。
- 預檢從原始 STYLE 的 font/bigFont/extendedFont 取來源，對使用於 TEXT/MTEXT/ATTRIB/ATTDEF/SHAPE 與部分 DIMENSION/LEADER 的樣式建立需求；大小寫、路徑、字型副檔名去重。**不把樣式名稱當字型，不自動替換**。空來源保持 unresolved。掃描包括所有 BLOCK 定義，並非僅畫面可見圖元；inline MTEXT 字型、MLEADER、外部 SHAPE 與所有動態參照尚未完整涵蓋，保留匯出端缺字閘門。
- 已實讀 MLightCAD v1.7.8 `AcApTextStyleFontPreload.ts`、`AcApOpenDatabaseOptions.ts` 與安裝版 converter protected parse API。沿用官方 FontManager 本機快取查詢，採自己的純函式依賴收集／預檢，不複製其他專案授權程式。
- CadFlux 固定 `4efa6712040d0ff2486e3c61f1766ce627fc67c8` 的 `packages/renderer-pdf/src/node.ts` 是 `DrawingDocument → jsPDF`，帶 Node 檔案輸出；未驗證 SHX/中文保真，不能只為速度整套替換。
- flyfish 固定 `0ce90d08bbf96aa780676ffeb81e0da12c575097` 的 `DwgLoader.ts` 提供 `preload` / `terminateWorker` 及 Worker-only 路徑。可作後續真正取消解析的設計參考；當前停止仍為重新載入，未宣稱 AbortSignal 能中止同步 WASM。AGPL 不引入本專案。
- 後續架構優先序：將 parser 原生 error bitmask 傳到 UI（現在上游 stats 的 unknownEntityCount=0 不代表無錯）→ 在原始字型可用後量測預覽／PDF 各階段 → 評估同版純 glyph provider／獨立 export Worker，避免先建 WebGL 預覽再重做字形。**這一批沒有完成 headless PDF Worker，也沒有驗證成功轉換加速倍數。**
