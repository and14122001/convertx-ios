import { AcApDocManager } from '@mlightcad/cad-simple-viewer'
import { AcDbDatabaseConverterManager, AcDbFileType } from '@mlightcad/data-model'
import { AcDbLibreDwgConverter } from '@mlightcad/libredwg-converter'
import { registerLazyPdfPlugin } from '@mlightcad/cad-pdf-plugin/register'
const status=document.getElementById('status') as HTMLElement
const fileInput=document.getElementById('file') as HTMLInputElement
const exportButton=document.getElementById('export') as HTMLButtonElement
const workerUrls={mtextRender:'./assets/mtext-renderer-worker.js',dwgParser:'./assets/libredwg-parser-worker.js'}
let initialized=false
let loading=false
const DWG_SIGNATURE=/^AC10\d{2}$/
function validateFile(file:File,bytes:ArrayBuffer){const header=new TextDecoder('ascii').decode(bytes.slice(0,6));if(/\.dwg$/i.test(file.name)&&!DWG_SIGNATURE.test(header))throw new Error('檔案不是可辨識的 DWG AC10xx 標頭');if(!bytes.byteLength)throw new Error('檔案為空')}

function message(s:string){status.textContent=s}
async function initialize(){if(initialized)return
  AcDbDatabaseConverterManager.instance.register(AcDbFileType.DWG,new AcDbLibreDwgConverter({convertByEntityType:false,useWorker:true,parserWorkerUrl:workerUrls.dwgParser}))
  const ready=await AcApDocManager.checkWebworkerReadiness(workerUrls)
  if(!ready)throw new Error('DWG/文字 Worker 資產未就緒，請確認 WASM 與 Worker 已部署')
  AcApDocManager.createInstance({container:document.getElementById('canvas')!,busyIndicatorHost:document.getElementById('viewer')!,autoResize:true,webworkerFileUrls:workerUrls})
  registerLazyPdfPlugin(AcApDocManager.instance.pluginManager)
  initialized=true
}
fileInput.addEventListener('change',async()=>{if(loading)return;loading=true;exportButton.disabled=true;const file=fileInput.files?.[0];if(!file){loading=false;return}try{if(!/\.(dwg|dxf)$/i.test(file.name))throw new Error('請選擇 DWG/DXF');message('初始化離線 DWG 解析器…');await initialize();message('正在解析 '+file.name);const bytes=await file.arrayBuffer();validateFile(file,bytes);await AcApDocManager.instance.openDocument(file.name,bytes,{minimumChunkSize:1000,readOnly:true});exportButton.disabled=false;message('圖面已載入。請先檢查圖元與字型，再輸出 PDF。')}catch(e){message('失敗：'+(e instanceof Error?e.message:String(e)))}finally{loading=false}})
exportButton.addEventListener('click',()=>{if(!initialized)return;message('執行 PDF 匯出命令；請確認輸出對話框與紙張比例');AcApDocManager.instance.sendStringToExecute('-cpdf')})
