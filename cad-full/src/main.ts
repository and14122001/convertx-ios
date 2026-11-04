import { validateCadFile } from './file-validation'
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
let documentReady=false
let exporting=false
let lastFileName=''
function resetFileState(){documentReady=false;exportButton.disabled=true}
function message(s:string){status.textContent=s}
async function initialize(){if(initialized)return
  AcDbDatabaseConverterManager.instance.register(AcDbFileType.DWG,new AcDbLibreDwgConverter({convertByEntityType:false,useWorker:true,parserWorkerUrl:workerUrls.dwgParser}))
  const ready=await AcApDocManager.checkWebworkerReadiness(workerUrls)
  if(!ready)throw new Error('DWG/文字 Worker 資產未就緒，請確認 WASM 與 Worker 已部署')
  AcApDocManager.createInstance({container:document.getElementById('canvas')!,busyIndicatorHost:document.getElementById('viewer')!,autoResize:true,webworkerFileUrls:workerUrls})
  registerLazyPdfPlugin(AcApDocManager.instance.pluginManager)
  initialized=true
}
fileInput.addEventListener('change',async()=>{if(loading)return;loading=true;resetFileState();const file=fileInput.files?.[0];if(!file){loading=false;return}try{if(!/\.(dwg|dxf)$/i.test(file.name))throw new Error('請選擇 DWG/DXF');message('初始化離線 DWG 解析器…');await initialize();message('正在解析 '+file.name);const bytes=await file.arrayBuffer();validateCadFile(file.name,bytes);await AcApDocManager.instance.openDocument(file.name,bytes,{minimumChunkSize:1000});lastFileName=file.name;documentReady=true;exportButton.disabled=false;message('圖面已載入。請先檢查圖元與字型，再輸出 PDF。')}catch(e){resetFileState();message('開啟圖面失敗：'+(e instanceof Error?e.message:String(e))+'。請重新選擇檔案。')}finally{loading=false}})
exportButton.addEventListener('click',()=>{if(!initialized||!documentReady||loading||exporting)return;exporting=true;exportButton.disabled=true;try{AcApDocManager.instance.sendStringToExecute('cpdf');message('已啟動 '+lastFileName+' 的 PDF 匯出指令。請在匯出介面完成設定；尚未確認 PDF 已產生或下載。')}catch(e){message('無法啟動 PDF 匯出：'+String(e))}finally{exporting=false;exportButton.disabled=!documentReady}})

const offlineStatus=document.getElementById('offline-status') as HTMLElement
function setOfflineStatus(s:string){offlineStatus.textContent='離線狀態：'+s}
async function checkOfflineCoreAssets(){
  // A few core files do not prove the lazy PDF chunks are available offline.
  const manifestUrl=new URL('./offline-manifest.json',location.href)
  const response=await fetch(manifestUrl,{cache:'no-store'})
  if(!response.ok) return false
  const manifest:unknown=await response.json()
  if(!manifest||typeof manifest!=='object')return false
  const {cacheName,assets}=manifest as {cacheName?:unknown,assets?:unknown}
  if(typeof cacheName!=='string'||!/^convertx-cad-full-[0-9a-f]{16}$/.test(cacheName))return false
  if(!Array.isArray(assets)||assets.length===0||!assets.every(x=>typeof x==='string'&&x.startsWith('./')))return false
  const scope=new URL('./',location.href)
  const cache=await caches.open(cacheName)
  const results=await Promise.all(assets.map(x=>cache.match(new URL(x,scope).href)))
  return results.every(Boolean)
}

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    setOfflineStatus('檢查核心資產中…')
    void navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(async reg=>{
      const update=async()=>{
        try{
          const ready=await checkOfflineCoreAssets()
          setOfflineStatus(ready?'完整建置資產已快取；仍須實機離線驗收':'尚未完整快取，請保持網路連線')
        }catch(e){setOfflineStatus('無法檢查快取：'+String(e))}
      }
      await update()
      reg.addEventListener('updatefound',()=>{
        const worker=reg.installing
        if(!worker)return
        setOfflineStatus('正在更新離線資產…')
        worker.addEventListener('statechange',()=>{if(worker.state==='activated')void update()})
      })
      navigator.serviceWorker.addEventListener('controllerchange',()=>{void update()})
    }).catch(e=>setOfflineStatus('無法註冊離線服務：'+String(e)))
  })
}else setOfflineStatus('此瀏覽器不支援 Service Worker')
