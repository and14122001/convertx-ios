# ConvertX CAD 驗證版部署

- 使用者已明確授權部署供瀏覽器驗證。
- 原始碼 commit：a05e4bfafdb69c5800af7f987a1b3237bfd92317。
- 網站成品 commit：990e99712a77fdc4afbe015d0128e26c9aadacfb。
- 建置工作：https://github.com/and14122001/convertx-ios/actions/runs/43809460582 ，安裝、75 測試、TypeScript、Vite、固定來源封裝、資產檢查、成品提交皆成功。
- 沿用 main 根目錄 Pages；GitHub Actions bot 提交不保證觸發分支 Pages，透過本次文件提交觸發發佈。
- 驗證入口：https://and14122001.github.io/convertx-ios/cad-test/ 。部署版識別在 cad-test/build-info.json。
- 首次連網等待「完整建置資產已快取」後，加入主畫面，飛航模式重新開啟並載入本機 DWG；字型須另外載入原圖授權字型並重開 DWG。
- 授權與來源：cad-test/legal/DWG-SOURCE.md；完整來源 archive 與 SHA256SUMS 在 cad-source/。來源不加入 PWA 預快取，避免離線安裝下載大型開發源碼。
- 測試版仍不是正式工程保真驗收：兩份真實工程 DWG／參考 PDF、文字／BLOCK／DIMENSION／HATCH／布局、iPhone Safari/PWA 下載與重啟需實測。
- 本紀錄建立時，線上 HTTP／瀏覽器驗證仍待 Pages 發佈完成；不能把 workflow 成功視為使用者實機成功。
