# iPhone PDF 匯出卡住：修復及限制

來源修復 commit：8ee952ed219c921385a63cad918e328b3c156483。
GitHub 建置：https://github.com/and14122001/convertx-ios/actions/runs/43812199128 ，全部步驟成功。
本機與 CI 已執行 npm ci、80 項 Node 測試（17 檔）、TypeScript、Vite、離線清單；同站來源封裝與發布文件檢查成功。

使用者截圖顯示 PDF 測量階段與 Rendering drawing 同時存在。固定上游文件及程式確認 openDocument 不保證 deferred glyph/INSERT jobs 已完成；已在匯出前使用 curView.waitUntilIdle，並提前檢查缺字型。新增渲染 60 秒／PDF 120 秒非同步 deadline、階段計時、停止重載。逾時後禁止重疊作業，晚到結果不下載。

沒有取得使用者的原始 DWG，因此僅能確認上述程式缺口與回歸測試，不能宣稱此圖已轉換成功。同步長計算可能延遲 JS 計時器；仍須真機大圖／字型保真驗證。

重新測試入口：https://and14122001.github.io/convertx-ios/cad-test/?v=8ee952e 。確認頁首版本 8ee952e；保持連網取得新資產，關閉舊分頁再開，避免舊 Service Worker 暫不啟用新版。
