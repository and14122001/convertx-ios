# 2026-11-16 Work 驗證紀錄

## GitHub 開發提交
- 起點：c93e024e7c4b9bfb652e2097b2afcbd2b58a5e2f
- 建置、lockfile、PDF API 與 Worker 路徑修復：04a735276b4b9296bb377d8fcfd51ba62eb6fc43
- 向量字形、本機字型、錯誤開檔閘門與來源稽核：8eab1073f2fa2decf71ae4cba4f441dda4afc8b7
- 第二批本機及 GitHub tree 均為 9348af6a356326e80a53a3215b4ad6c5b029b803。

## 實際命令／結果
| 命令（cad-full 下） | 結果 |
|---|---|
| npm ci --ignore-scripts --no-audit --no-fund | 成功，固定 lockfile |
| npm run build | 成功：內含 npm run test、tsc --noEmit、vite build、offline:generate、check:dist |
| Node tests | 73 項、15 檔通過；非全部為執行式保真測試，部分既有測試仍為原始碼斷言 |
| node scripts/probe-dwg.mjs <Arc.dwg> <Line.dwg> | 真實 WASM 解析及 PDF 產生成功，A4 MediaBox 通過；詳見同目錄 jsonl |
| CAD_RELEASE=1 npm run check:dist | 失敗：缺少完整 DWG source distribution document；正式發行禁止 |
| git diff --check | 通過 |

## 未通過／尚未執行
- Chromium 啟動被環境禁止 socket()，尚未開頁；不能宣稱瀏覽器、Worker 通訊、字型 IndexedDB 或飛航重啟成功。
- iPhone Safari/PWA 飛航模式載入、轉換、下載、重新開啟 PDF：未實機驗收。
- 兩份不同工程來源 DWG + 參考 PDF 的文字、布局、BLOCK、DIMENSION、HATCH、線型與圖層比對：未完成。
- Arc/Line 是同一上游的單圖元 regression fixtures，不能拿來取代上述驗收。
- example_2000 / example_2018 解析警告碼 64 / 68；未完整建立 UI 警告傳遞，不得忽略或認定完整保真。
- GPL：WASM 與固定上游 binary SHA-256 一致；完整 corresponding-source bundle、子模組、工具鏈可重建及 notices 尚未全部核對。

未部署正式版本、未觸發 Actions、未修改其他儲存庫或任何既有排程。
