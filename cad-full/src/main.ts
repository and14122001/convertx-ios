import { AcApDocManager } from '@mlightcad/cad-simple-viewer'
import { AcDbDatabaseConverterManager, AcDbFileType } from '@mlightcad/data-model'
import { AcDbLibreDwgConverter } from '@mlightcad/libredwg-converter'
import { registerLazyPdfPlugin } from '@mlightcad/cad-pdf-plugin/register'
const status=document.getElementById('status') as HTMLElement
const fileInput=document.getElementById('file') as HTMLInputElement
const exportButton=document.getElementById('export') as HTMLButtonElement
const workerUrls={mtextRender:'./assets/mtext-renderer-worker.js',dwgParser:'./assets/libredwg-parser-worker.js'}
let initialized=false
function message(s:string){status.textContent=s}
async function initialize(){if(initialized)return
  AcDbDatabaseConverterManager.instance.register(AcDbFileType.DWG,new AcDbLibreDwgConverter({convertByEntityType:false,useWorker:true,parserWorkerUrl:workerUrls.dwgParser}))
  const ready=await AcApDocManager.checkWebworkerReadiness(workerUrls)
  if(!ready)throw new Error('DWG/文字 Worker 資產未就緒，請確認 WASM 與 Worker 已部署')
  AcApDocManager.createInstance({container:document.getElementById('canvas')!,busyIndicatorHost:document.getElementById('viewer')!,autoResize:true,webworkerFileUrls:workerUrls})
  registerLazyPdfPlugin(AcApDocManager.instance.pluginManager)
  initialized=true
}
fileInput.addEventListener('change',async()=>{exportButton.disabled=true;const file=fileInput.files?.[0];if(!file)return;try{if(!/\.(dwg|dxf)$/i.test(file.name))throw new Error('請選擇 DWG/DXF');message('初始化離線 DWG 解析器…');await initialize();message('正在解析 '+file.name);await AcApDocManager.instance.openDocument(file.name,await file.arrayBuffer(),{minimumChunkSize:1000,readOnly:true});exportButton.disabled=false;message('圖面已載入。請先檢查圖元與字型，再輸出 PDF。')}catch(e){message('失敗：'+(e instanceof Error?e.message:String(e)))}})
exportButton.addEventListener('click',()=>{if(!initialized)return;message('執行 PDF 匯出命令；請確認輸出對話框與紙張比例');AcApDocManager.instance.sendStringToExecute('cpdf')})
