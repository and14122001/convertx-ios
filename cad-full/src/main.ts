import {recommendLayout} from './smart-layout.mjs'
import {PDFDocument} from 'pdf-lib'
import {resolvePaper} from './paper-sizes.mjs'
import {inspectPdfBytes} from './pdf-audit.mjs'
import {inspectDwgHeader,parseUnitChoice} from './dwg-preflight.mjs'
import { validateCadFile } from './file-validation'
import { AcApDocManager, AcApSettingManager } from '@mlightcad/cad-simple-viewer'
import { AcDbDatabaseConverterManager, AcDbFileType } from '@mlightcad/data-model'
import { AcDbLibreDwgConverter } from '@mlightcad/libredwg-converter'
import { registerLazyPdfPlugin } from '@mlightcad/cad-pdf-plugin/register'
import { exportDatabaseToPdf } from '@mlightcad/pdf-renderer'
const status=document.getElementById('status') as HTMLElement
const fileInput=document.getElementById('file') as HTMLInputElement
const exportButton=document.getElementById('export') as HTMLButtonElement
const workerUrls={mtextRender:'./assets/mtext-renderer-worker.js',dwgParser:'./assets/libredwg-parser-worker.js'}
let initialized=false
let loading=false
let documentReady=false
let exporting=false
let lastFileName=''
let lastPreflight=''
const unitChoice=document.getElementById('unit-choice') as HTMLSelectElement
const paperChoice=document.getElementById('paper-choice') as HTMLSelectElement
const marginChoice=document.getElementById('paper-margin') as HTMLInputElement
const layoutAdvice=document.getElementById('layout-advice') as HTMLElement
const paperOrientation=document.getElementById('paper-orientation') as HTMLSelectElement
const customWidth=document.getElementById('paper-width') as HTMLInputElement
const customHeight=document.getElementById('paper-height') as HTMLInputElement
paperChoice.addEventListener('change',()=>{const custom=paperChoice.value==='custom';customWidth.disabled=!custom;customHeight.disabled=!custom})
function resetFileState(){documentReady=false;lastPreflight='';exportButton.disabled=true}
function message(s:string){status.textContent=s}
async function initialize(){if(initialized)return
  AcDbDatabaseConverterManager.instance.register(AcDbFileType.DWG,new AcDbLibreDwgConverter({convertByEntityType:false,useWorker:true,parserWorkerUrl:workerUrls.dwgParser}))
  const ready=await AcApDocManager.checkWebworkerReadiness(workerUrls)
  if(!ready)throw new Error('DWG/文字 Worker 資產未就緒，請確認 WASM 與 Worker 已部署')
  AcApDocManager.createInstance({container:document.getElementById('canvas')!,busyIndicatorHost:document.getElementById('viewer')!,autoResize:true,webworkerFileUrls:workerUrls})
  registerLazyPdfPlugin(AcApDocManager.instance.pluginManager)
  initialized=true
}
fileInput.addEventListener('change',async()=>{if(loading)return;loading=true;resetFileState();const file=fileInput.files?.[0];if(!file){loading=false;return}try{if(!/\.(dwg|dxf)$/i.test(file.name))throw new Error('請選擇 DWG/DXF');message('初始化離線 DWG 解析器…');await initialize();message('正在解析 '+file.name);const bytes=await file.arrayBuffer();const kind=validateCadFile(file.name,bytes);lastPreflight=kind==='DWG'?(()=>{const info=inspectDwgHeader(bytes);return 'DWG '+info.code+' ('+(info.version??'未知版本')+')。'+info.warnings.join('；')})():'DXF：尚未驗證圖元完整性與單位';await AcApDocManager.instance.openDocument(file.name,bytes,{minimumChunkSize:1000});lastFileName=file.name;documentReady=true;exportButton.disabled=false;message('圖面已載入。'+lastPreflight+'。請先檢查圖元、字型與外部參照；尚未驗證 PDF 保真。')}catch(e){resetFileState();message('開啟圖面失敗：'+(e instanceof Error?e.message:String(e))+'。請重新選擇檔案。')}finally{loading=false}})
exportButton.addEventListener('click',async()=>{
 if(!initialized||!documentReady||loading||exporting)return
 exporting=true;exportButton.disabled=true
 try{
  const choice=parseUnitChoice(unitChoice.value)
  const db=AcApDocManager.instance.context.doc.database
  // Fixed v1.7.8 PDF renderer: export model space using native vectors.
  // Do not infer INSUNITS, paper scale, external references or font availability.
  const marginMm=Number(marginChoice.value)
  if(!Number.isFinite(marginMm)||marginMm<0||marginMm>100)throw new Error('留白需為 0–100 mm')
  let selectedPaper=resolvePaper(paperChoice.value,paperOrientation.value,customWidth.value,customHeight.value)
  let advice='手動紙張設定'
  if(paperChoice.value==='auto'){
   message('正在依實際可繪圖元測量邊界並推薦紙張…')
   const measurement=await exportDatabaseToPdf(db,{paper:'extents',marginMm:0,background:'none',fit:'extents',layouts:'current',fontMapping:AcApSettingManager.instance.fontMapping})
   const measuredDoc=await PDFDocument.load(measurement)
   const page=measuredDoc.getPages()[0]
   if(!page)throw new Error('實際圖元沒有可測量的 PDF 頁面')
   const w=page.getWidth(),h=page.getHeight()
   if(w>=14399||h>=14399)throw new Error('圖元範圍超過 PDF 測量上限，請手動指定紙張')
   const recommended=recommendLayout(w,h,marginMm)
   selectedPaper=recommended.paper
   advice='自動推薦 '+recommended.key.toUpperCase()+' '+(recommended.orientation==='landscape'?'橫向':'直向')+'；可印區利用率約 '+(recommended.occupancy*100).toFixed(1)+'%（實際渲染圖元估算，非工程比例）'
   layoutAdvice.textContent=advice
  }
  const bytes=await exportDatabaseToPdf(db,{
   title:lastFileName,
   ltscale:db.ltscale,
   celtscale:db.celtscale,
   showLineWeight:!!db.lwdisplay,
   background:'none',
   fontMapping: AcApSettingManager.instance.fontMapping,
   paper: selectedPaper,
   marginMm,
   fit:'extents',
   layouts:'current'
  })
  const audit=inspectPdfBytes(bytes)
  const filename=lastFileName.replace(/\.(dwg|dxf)$/i,'')+'.pdf'
  const blob=new Blob([new Uint8Array(bytes)],{type:'application/pdf'})
  const url=URL.createObjectURL(blob)
  try{
   const link=document.createElement('a')
   link.href=url;link.download=filename;link.rel='noopener'
   document.body.appendChild(link);link.click();link.remove()
  }finally{window.setTimeout(()=>URL.revokeObjectURL(url),60000)}
  message('已產生 PDF '+audit.byteLength+' bytes（'+audit.version+'）並要求瀏覽器下載 '+filename+'。'+advice+'；'+choice.warning+'；紙張選項不代表已實現 1:N 工程比例；缺少 PDF glyphProvider，TEXT/MTEXT/SHAPE 可能不顯示，未驗證字型、XREF、圖元保真及 Safari 下載完成。')
 }catch(e){message('PDF 產生失敗：'+(e instanceof Error?e.message:String(e)))}
 finally{exporting=false;exportButton.disabled=!documentReady||loading}
})

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
  if(!Array.isArray(assets)||assets.length===0||!assets.every(x=>typeof x==='string'&&(x==='./'||/^\.\/[a-zA-Z0-9_./-]+$/.test(x))&&!x.includes('..')&&!x.includes('//')))return false
  if(new Set(assets).size!==assets.length)return false
  if(!assets.includes('./index.html')||!assets.includes('./assets/libredwg-parser-worker.js'))return false
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

const pdfCheck=document.getElementById('pdf-check') as HTMLInputElement
pdfCheck.addEventListener('change',async()=>{
 const file=pdfCheck.files?.[0]
 if(!file)return
 try{
  if(!/\.pdf$/i.test(file.name))throw new Error('請選擇 PDF 檔')
  const result=inspectPdfBytes(await file.arrayBuffer())
  message('已檢查 '+file.name+'：PDF '+result.version+'、'+result.byteLength+' bytes；'+result.warnings.join('；')+'。此檢查無法確認檔案由目前 DWG 匯出。')
 }catch(e){message('PDF 基本檢查失敗：'+(e instanceof Error?e.message:String(e)))}
 finally{pdfCheck.value=''}
})
