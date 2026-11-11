import {inspectPdfBytes} from './pdf-audit.mjs'
import {inspectDwgHeader,parseUnitChoice} from './dwg-preflight.mjs'
import { validateCadFile } from './file-validation'
import { AcApDocManager } from '@mlightcad/cad-simple-viewer'
import { AcDbDatabaseConverterManager, AcDbFileType } from '@mlightcad/data-model'
import { AcDbLibreDwgConverter } from '@mlightcad/libredwg-converter'
import { AcApPdfConvertor, type AcApPdfExportOptions } from '@mlightcad/cad-pdf-plugin'
import { PDFDocument } from 'pdf-lib'
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
const orientationChoice=document.getElementById('orientation-choice') as HTMLSelectElement
function resetFileState(){documentReady=false;lastPreflight='';exportButton.disabled=true}
function message(s:string){status.textContent=s}
async function initialize(){if(initialized)return
  AcDbDatabaseConverterManager.instance.register(AcDbFileType.DWG,new AcDbLibreDwgConverter({convertByEntityType:false,useWorker:true,parserWorkerUrl:workerUrls.dwgParser}))
  const ready=await AcApDocManager.checkWebworkerReadiness(workerUrls)
  if(!ready)throw new Error('DWG/文字 Worker 資產未就緒，請確認 WASM 與 Worker 已部署')
  AcApDocManager.createInstance({container:document.getElementById('canvas')!,busyIndicatorHost:document.getElementById('viewer')!,autoResize:true,webworkerFileUrls:workerUrls})
  initialized=true
}
fileInput.addEventListener('change',async()=>{if(loading)return;loading=true;resetFileState();const file=fileInput.files?.[0];if(!file){loading=false;return}try{if(!/\.(dwg|dxf)$/i.test(file.name))throw new Error('請選擇 DWG/DXF');message('初始化離線 DWG 解析器…');await initialize();message('正在解析 '+file.name);const bytes=await file.arrayBuffer();const kind=validateCadFile(file.name,bytes);lastPreflight=kind==='DWG'?(()=>{const info=inspectDwgHeader(bytes);return 'DWG '+info.code+' ('+(info.version??'未知版本')+')。'+info.warnings.join('；')})():'DXF：尚未驗證圖元完整性與單位';await AcApDocManager.instance.openDocument(file.name,bytes,{minimumChunkSize:1000});lastFileName=file.name;documentReady=true;exportButton.disabled=false;message('圖面已載入。'+lastPreflight+'。請先檢查圖元、字型與外部參照；尚未驗證 PDF 保真。')}catch(e){resetFileState();message('開啟圖面失敗：'+(e instanceof Error?e.message:String(e))+'。請重新選擇檔案。')}finally{loading=false}})
exportButton.addEventListener('click',async()=>{
 if(!initialized||!documentReady||loading||exporting)return
 exporting=true;exportButton.disabled=true
 try{
  const choice=parseUnitChoice(unitChoice.value)
  const [widthMm,heightMm]=paperChoice.value.split('x').map(Number)
  if(!Number.isFinite(widthMm)||!Number.isFinite(heightMm)||widthMm<=0||heightMm<=0)throw new Error('紙張尺寸設定無效')
  const landscape=orientationChoice.value==='landscape'
  const paper={widthMm:landscape?Math.max(widthMm,heightMm):Math.min(widthMm,heightMm),heightMm:landscape?Math.min(widthMm,heightMm):Math.max(widthMm,heightMm)}
  const context=AcApDocManager.instance.context
  if(!context?.doc?.database)throw new Error('目前沒有可匯出的 CAD 資料庫')
  message('正在產生向量 PDF 位元組…')
  // MLightCAD 1.7.8's public convert() calls exportDatabaseToPdf() with its
  // viewer glyph provider, font mapping and text fallback, then downloads
  // internally. Capture that exact Uint8Array at its pinned internal sink.
  const pdfConvertor=new AcApPdfConvertor()
  let rendererBytes:Uint8Array|undefined
  const pinnedSink=pdfConvertor as unknown as {downloadBytes:(bytes:Uint8Array,name:string)=>void}
  pinnedSink.downloadBytes=(bytes)=>{rendererBytes=new Uint8Array(bytes)}
  const exportOptions:AcApPdfExportOptions={modelSpaceFit:'extents',exportLayouts:true,textMode:'text'}
  await pdfConvertor.convert(context,exportOptions)
  if(!rendererBytes?.byteLength)throw new Error('MLightCAD 未回傳 PDF 位元組')
  // Keep the vector page content while normalizing every page to the requested
  // sheet size. This is an automatic fit, not a declared engineering scale.
  const sourcePdf=await PDFDocument.load(rendererBytes)
  const outputPdf=await PDFDocument.create()
  const embeddedPages=await outputPdf.embedPdf(rendererBytes)
  const marginPt=10*72/25.4
  for(const [index,sourcePage] of sourcePdf.getPages().entries()){
   const page=outputPdf.addPage([paper.widthMm*72/25.4,paper.heightMm*72/25.4])
   const embedded=embeddedPages[index]
   if(!embedded)throw new Error('PDF 頁面嵌入失敗：'+(index+1))
   const scale=Math.min((page.getWidth()-marginPt*2)/sourcePage.getWidth(),(page.getHeight()-marginPt*2)/sourcePage.getHeight())
   const width=sourcePage.getWidth()*scale,height=sourcePage.getHeight()*scale
   page.drawPage(embedded,{x:(page.getWidth()-width)/2,y:(page.getHeight()-height)/2,width,height})
  }
  const bytes=await outputPdf.save()
  const checkedPdf=await PDFDocument.load(bytes)
  if(checkedPdf.getPageCount()!==sourcePdf.getPageCount())throw new Error('輸出 PDF 頁數與 MLightCAD 渲染頁數不一致')
  for(const page of checkedPdf.getPages()){
   const epsilon=0.1
   if(Math.abs(page.getWidth()-paper.widthMm*72/25.4)>epsilon||Math.abs(page.getHeight()-paper.heightMm*72/25.4)>epsilon)throw new Error('輸出 PDF 頁面尺寸與設定不一致')
  }
  const audit=inspectPdfBytes(bytes)
  const pdfBuffer=new ArrayBuffer(bytes.byteLength)
  new Uint8Array(pdfBuffer).set(bytes)
  const blob=new Blob([pdfBuffer],{type:'application/pdf'})
  const url=URL.createObjectURL(blob)
  const link=document.createElement('a')
  link.href=url
  link.download=(lastFileName.replace(/\.(dwg|dxf)$/i,'')||'drawing')+'.pdf'
  link.rel='noopener'
  document.body.appendChild(link);link.click();link.remove()
  window.setTimeout(()=>URL.revokeObjectURL(url),60000)
  message('已產生並送出 PDF 下載：'+audit.byteLength+' bytes，PDF '+audit.version+'、'+checkedPdf.getPageCount()+' 頁；MediaBox 已核對為 '+paper.widthMm+'×'+paper.heightMm+' mm、'+(landscape?'橫向':'直向')+'。圖面範圍自動配適，非 1:N 工程比例；紙張空間頁面亦按所選紙張等比例置入。'+choice.warning+' 請檢查字型 fallback、XREF、DIMENSION、HATCH、BLOCK/INSERT 與圖元差異；目前不宣稱保真驗收通過。')
 }catch(e){message('PDF 匯出失敗：'+(e instanceof Error?e.message:String(e)))}
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
