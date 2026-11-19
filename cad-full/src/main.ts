import {loadAutomaticFont,preparePreviewFont} from './automatic-font-loading.mjs'
import {createFontSettings} from './font-settings'
import {extractTtcFaces} from './ttc-fonts.mjs'
import {requireMappedFonts,AUTO_FONT,permitsSubstitution} from './font-policy.mjs'
import {withDeadline,requireRenderIdle,ExportTimeoutError,missingFontMessage} from './export-lifecycle.mjs'
import {openVerifiedDocument} from './open-document.mjs'
import {FontManager} from '@mlightcad/mtext-renderer'
import {AcTrMTextRenderer} from '@mlightcad/three-renderer'
import {createViewerPdfGlyphProvider} from './pdf-glyph-provider'
import {recommendLayout} from './smart-layout.mjs'
import {uniformPdfPlacement,verifyPdfPageGeometry} from './pdf-layout-geometry.mjs'
import {requireSinglePage,requirePaperMargin} from './pdf-export-policy.mjs'
import {PDFDocument,StandardFonts,rgb} from 'pdf-lib'
import {resolvePaper} from './paper-sizes.mjs'
import {inspectPdfBytes} from './pdf-audit.mjs'
import {inspectDwgHeader,parseUnitChoice} from './dwg-preflight.mjs'
import { validateCadFile } from './file-validation'
import { AcApDocManager, AcApSettingManager, AcApFontUtil } from '@mlightcad/cad-simple-viewer'
import { AcDbDatabaseConverterManager, AcDbFileType } from '@mlightcad/data-model'
import { PreflightDwgConverter } from './preflight-converter'
import { registerLazyPdfPlugin } from '@mlightcad/cad-pdf-plugin/register'
import { exportDatabaseToPdf } from '@mlightcad/pdf-renderer'
const status=document.getElementById('status') as HTMLElement
const loadTiming=document.getElementById('load-timing') as HTMLElement
const fontDetails=document.getElementById('font-details') as HTMLElement
const fileInput=document.getElementById('file') as HTMLInputElement
const exportButton=document.getElementById('export') as HTMLButtonElement
const pdfOpenLink=document.getElementById('pdf-open') as HTMLAnchorElement
let retainedPdfUrl:string|null=null
const workerUrls={mtextRender:'./assets/mtext-renderer-worker.js',dwgParser:'./assets/libredwg-parser-worker.js'}
const converter=new PreflightDwgConverter({convertByEntityType:false,useWorker:true,parserWorkerUrl:workerUrls.dwgParser})
let fontLoading=false
let exportInvalidated=false
const stopExport=document.getElementById('stop-export') as HTMLButtonElement
stopExport.addEventListener('click',()=>location.reload())
let initialized=false
let loading=false
let documentReady=false
let exporting=false
let lastFileName=''
let lastPreflight=''
const unitChoice=document.getElementById('unit-choice') as HTMLSelectElement
const paperChoice=document.getElementById('paper-choice') as HTMLSelectElement
const unsupportedNotice=document.getElementById('unsupported-notice') as HTMLElement
const marginChoice=document.getElementById('paper-margin') as HTMLInputElement
const layoutAdvice=document.getElementById('layout-advice') as HTMLElement
const paperOrientation=document.getElementById('paper-orientation') as HTMLSelectElement
const customWidth=document.getElementById('paper-width') as HTMLInputElement
const customHeight=document.getElementById('paper-height') as HTMLInputElement
function updatePaperControls(){
 const auto=paperChoice.value==='auto'
 const custom=paperChoice.value==='custom'
 paperOrientation.disabled=auto||paperChoice.value==='extents'
 customWidth.disabled=!custom
 customHeight.disabled=!custom
 layoutAdvice.textContent=auto?'自動方向與紙張由渲染頁面比例決定；原始 CAD 單位未推定。':'手動紙張；縮放比例不等於 1:N 工程比例。'
}
paperChoice.addEventListener('change',updatePaperControls)
updatePaperControls()
const fontSettings=createFontSettings(()=>{resetFileState();fileInput.value=''},message,()=>loading||exporting||fontLoading||exportInvalidated)
function resetFileState(){documentReady=false;lastPreflight='';exportButton.disabled=true;layoutAdvice.textContent='尚未分析圖面';unsupportedNotice.textContent='尚未檢查圖面保真風險'}
function message(s:string){status.textContent=s}
let autoFontWarning=''
function prepareAutomaticFont(){return withDeadline(()=>loadAutomaticFont({
 loadMain:(names:string[])=>FontManager.instance.loadFontsByNames(names),
 isMainLoaded:(name:string)=>FontManager.instance.isFontLoaded(name),
 loadRenderer:(names:string[],options:{scope:'all'})=>AcTrMTextRenderer.getInstance().loadFonts(names,options)
}),30000,'替代字型準備')}
document.getElementById('font-check')!.addEventListener('click',async()=>{
 if(loading||exporting||fontLoading||exportInvalidated)return
 fontLoading=true;message('正在檢查主執行緒與文字 Worker 的內建字型…')
 try{await initialize();await prepareAutomaticFont();message('內建字型檢查通過：主執行緒已載入 Noto Sans TC，文字 Worker 載入請求已完成。尚未驗證整張圖的 PDF。')}catch(error){message('內建字型檢查失敗：'+String(error))}finally{fontLoading=false}
})
async function initialize(){if(initialized)return
  AcDbDatabaseConverterManager.instance.register(AcDbFileType.DWG,converter)
  const ready=await AcApDocManager.checkWebworkerReadiness(workerUrls)
  if(!ready)throw new Error('DWG/文字 Worker 資產未就緒，請確認 WASM 與 Worker 已部署')
  AcApDocManager.createInstance({baseUrl:new URL('./',location.href).href,container:document.getElementById('canvas')!,busyIndicatorHost:document.getElementById('viewer')!,autoResize:true,webworkerFileUrls:workerUrls})
  registerLazyPdfPlugin(AcApDocManager.instance.pluginManager)
  FontManager.instance.enableFontCache=true
  initialized=true
}
fileInput.addEventListener('change',async()=>{if(loading||exporting||fontLoading||exportInvalidated)return;loading=true;resetFileState();converter.lastIssue='';converter.fontWarning='';converter.lastReport=undefined;const file=fileInput.files?.[0];if(!file){loading=false;return}fileInput.disabled=true;stopExport.hidden=false;fontDetails.textContent='';const loadStarted=performance.now();const loadTimer=window.setInterval(()=>{loadTiming.textContent='本次開啟已耗時 '+((performance.now()-loadStarted)/1000).toFixed(0)+' 秒；可停止並重新載入'},1000);try{if(!/\.(dwg|dxf)$/i.test(file.name))throw new Error('請選擇 DWG/DXF');message('初始化離線 DWG 解析器…');await initialize();autoFontWarning='';if(fontSettings.mode==='auto'){message('準備內建替代字型…');const preparation=await preparePreviewFont(prepareAutomaticFont);autoFontWarning=preparation.warning}message('正在解析 '+file.name+'；圖形漸進顯示，缺字型僅警告');const bytes=await file.arrayBuffer();const kind=validateCadFile(file.name,bytes);lastPreflight=kind==='DWG'?(()=>{const info=inspectDwgHeader(bytes);return 'DWG '+info.code+' ('+(info.version??'未知版本')+')。'+info.warnings.join('；')})():'DXF：尚未驗證圖元完整性與單位';converter.mapping=fontSettings.mapping;converter.mode=fontSettings.mode;await openVerifiedDocument(AcApDocManager.instance,file.name,bytes,{minimumChunkSize:250,progressiveRendering:true});lastFileName=file.name;documentReady=true;exportButton.disabled=false;
unsupportedNotice.textContent='保真風險：目前無法完整確認 DWG 中 XREF、缺字型、代理物件、不可解析圖元、DIMENSION/HATCH/BLOCK/INSERT 是否遺失。匯出前請核對原始 DWG；PDF 輸出成功不代表圖元完整。';message((autoFontWarning?autoFontWarning+'\n':'')+(converter.fontWarning?converter.fontWarning+'\n':'')+'圖形資料已載入，預覽可能仍在背景繪製。'+lastPreflight+'。請先檢查圖元、字型與外部參照；尚未驗證 PDF 保真。')}catch(e){resetFileState();message(converter.lastIssue||('開啟圖面失敗：'+(e instanceof Error?e.message:String(e))+'。請重新選擇檔案。'));if(e instanceof ExportTimeoutError){exportInvalidated=true;fileInput.disabled=true;stopExport.hidden=false}}finally{loading=false;window.clearInterval(loadTimer);loadTiming.textContent='本次開啟耗時 '+((performance.now()-loadStarted)/1000).toFixed(1)+' 秒（此裝置實測）';if(converter.lastReport){fontDetails.textContent=JSON.stringify(converter.lastReport,null,2);fontSettings.suggest([...converter.lastReport.report.requirements.map((f:any)=>f.name),...converter.lastReport.report.unresolved])}fileInput.disabled=exportInvalidated;stopExport.hidden=exportInvalidated?false:true}})
exportButton.addEventListener('click',async()=>{
 if(!initialized||!documentReady||loading||exporting||fontLoading||exportInvalidated)return
 exporting=true;exportButton.disabled=true;fileInput.disabled=true;stopExport.hidden=false
 let phase='檢查文字與渲染狀態'
 const started=Date.now()
 const setExportPhase=(text:string)=>{phase=text;message(text)}
 const progressTimer=window.setInterval(()=>message(phase+'（已等待 '+Math.floor((Date.now()-started)/1000)+' 秒；可按「停止並重新載入」）'),1000)
 try{
  if(fontSettings.mode==='auto'){setExportPhase('檢查主執行緒與文字 Worker 字型');await prepareAutomaticFont()}
  const view=AcApDocManager.instance.curView
  const isLoaded=(name:string)=>FontManager.instance.isFontLoaded(name)
  const checkFonts=()=>{
   const report=converter.lastReport?.report
   if(report)requireMappedFonts([...report.requirements.map((f:any)=>f.name),...report.unresolved],fontSettings.mapping,isLoaded,fontSettings.mode)
  }
  checkFonts()
  setExportPhase('等待預覽文字／圖塊渲染完成，尚未開始 PDF（最長 60 秒）')
  await requireRenderIdle(view,60000)
  checkFonts()
  FontManager.instance.clearMissedFonts();FontManager.instance.unsupportedChars={}
  setExportPhase('正在產生向量 PDF（最長 120 秒）')
  const choice=parseUnitChoice(unitChoice.value)
  const db=AcApDocManager.instance.context.doc.database
  // Fixed v1.7.8 PDF renderer: export model space using native vectors.
  // Do not infer INSUNITS, paper scale, external references or font availability.
  const glyphFailures:string[]=[]
  const glyphProvider=createViewerPdfGlyphProvider(message=>glyphFailures.push(message),fontSettings.mapping,fontSettings.mode)
  const marginMm=Number(marginChoice.value)
  if(!Number.isFinite(marginMm)||marginMm<0||marginMm>100)throw new Error('留白需為 0–100 mm')
  let selectedPaper: 'extents' | {widthMm:number;heightMm:number}=paperChoice.value==='auto' ? 'extents' : resolvePaper(paperChoice.value,paperOrientation.value,customWidth.value,customHeight.value)
  if(selectedPaper!=='extents')requirePaperMargin(selectedPaper,marginMm)
  let advice='手動紙張設定'
  let autoMeasurement: Uint8Array | undefined
  if(paperChoice.value==='auto'){
   setExportPhase('正在產生向量 PDF，完成後推薦紙張（最長 120 秒）')
   const measurement=await withDeadline(async()=>await exportDatabaseToPdf(db,{glyphProvider,title:lastFileName,paper:'extents',marginMm:0,background:'none',fit:'extents',layouts:'current',ltscale:db.ltscale,celtscale:db.celtscale,showLineWeight:!!db.lwdisplay,fontMapping:AcApSettingManager.instance.fontMapping}),120000,'向量 PDF')
   autoMeasurement=measurement
   const measuredDoc=await PDFDocument.load(measurement)
   const page=requireSinglePage(measuredDoc,'自動排版測量 PDF')
   const w=page.getWidth(),h=page.getHeight()
   if(w>=14399||h>=14399)throw new Error('圖元範圍超過 PDF 測量上限，請手動指定紙張')
   // The renderer adds its own padding; this is an aspect-ratio estimate,
   // not a direct geometry bounding box or proof of CAD scale.
   const recommended=recommendLayout(w,h,marginMm)
   selectedPaper=recommended.paper
   // Auto recommendations must pass the same physical-page and margin gate as manual paper.
   requirePaperMargin(selectedPaper,marginMm)
   advice='自動推薦 '+recommended.key.toUpperCase()+' '+(recommended.orientation==='landscape'?'橫向':'直向')+'；可印區利用率約 '+(recommended.occupancy*100).toFixed(1)+'%（依渲染 PDF 頁面比例估算，含渲染留白，非精確圖元邊界／工程比例）'
   layoutAdvice.textContent=advice
  }
  // Preserve the exact same drawing renderer settings in auto and manual modes.
  const measuredBytes=autoMeasurement
  let bytes=measuredBytes ? await (async()=>{
   // pdf-lib embeds the measured PDF page as vector Form XObject, allowing
   // uniform UPSCALING that fixed-paper renderer v1.7.8 otherwise forbids.
   const src=await PDFDocument.load(measuredBytes)
   const sourcePage=requireSinglePage(src,'智慧排版來源 PDF')
   const dst=await PDFDocument.create()
   dst.setTitle(lastFileName)
   dst.setSubject('ConvertX vector PDF smart layout; original CAD unit not inferred')
   const [embedded]=await dst.embedPages([sourcePage])
   const widthPt=selectedPaper==='extents'?sourcePage.getWidth():selectedPaper.widthMm*72/25.4
   const heightPt=selectedPaper==='extents'?sourcePage.getHeight():selectedPaper.heightMm*72/25.4
   // Source page includes renderer padding. Scale uniformly, never stretch X/Y independently.
   requirePaperMargin(selectedPaper,marginMm)
   const placement=uniformPdfPlacement(embedded.width,embedded.height,widthPt,heightPt,marginMm)
   const out=dst.addPage([widthPt,heightPt])
   out.drawPage(embedded,placement)
   return dst.save({useObjectStreams:true})
  })() : await withDeadline(async()=>await exportDatabaseToPdf(db,{
   glyphProvider,
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
  }),120000,'向量 PDF')
  const missingFonts=Object.keys(FontManager.instance.missedFonts)
  const unsupportedChars=Object.keys(FontManager.instance.getUnsupportedChar())
  requireMappedFonts(missingFonts,fontSettings.mapping,isLoaded,fontSettings.mode)
  if(unsupportedChars.length)throw new Error('停止下載：仍有無法繪製的字元 '+unsupportedChars.join(' '))
  if(glyphFailures.length)throw new Error('停止下載：'+glyphFailures.join('；'))
  if(permitsSubstitution(fontSettings.mode)){
   const labeled=await PDFDocument.load(bytes)
   const labelFont=await labeled.embedFont(StandardFonts.Helvetica)
   for(const page of labeled.getPages())page.drawText('FONT SUBSTITUTION - VERIFY TEXT AND DIMENSIONS',{x:6,y:6,size:Math.max(1,Math.min(7,(page.getWidth()-12)/210*7)),font:labelFont,color:rgb(0.7,0.1,0.1)})
   labeled.setSubject('Font substitution mode '+fontSettings.mode+'; original typography NOT verified. '+JSON.stringify({manual:fontSettings.mapping,automatic:fontSettings.mode==='auto'?AUTO_FONT:undefined,used:converter.lastReport?.substitutions}))
   bytes=await labeled.save()
  }
  const audit=inspectPdfBytes(bytes)
  const verifiedDoc=await PDFDocument.load(bytes)
  const verifiedPage=requireSinglePage(verifiedDoc,'輸出 PDF')
  if(bytes.byteLength===0)throw new Error('PDF 匯出為空檔，停止下載')
  const actualWidthMm=verifiedPage.getWidth()*25.4/72
  const actualHeightMm=verifiedPage.getHeight()*25.4/72
  verifyPdfPageGeometry(verifiedPage.getWidth(),verifiedPage.getHeight(),selectedPaper,marginMm)
  const pageAudit='PDF MediaBox '+actualWidthMm.toFixed(1)+'×'+actualHeightMm.toFixed(1)+' mm'
  const filename=lastFileName.replace(/\.(dwg|dxf)$/i,'')+(permitsSubstitution(fontSettings.mode)?'-substituted':'')+'.pdf'
  const blob=new Blob([new Uint8Array(bytes)],{type:'application/pdf'})
  const url=URL.createObjectURL(blob)
  // Keep the same-origin Blob URL alive for manual Safari/PWA open or Share → Save to Files.
  // Do not revoke it after a fixed 60-second timeout: users may need longer to find the link.
  const previousPdfUrl=retainedPdfUrl
  retainedPdfUrl=url
  pdfOpenLink.href=url
  pdfOpenLink.download=filename
  pdfOpenLink.hidden=false
  if(previousPdfUrl)URL.revokeObjectURL(previousPdfUrl)
  const link=document.createElement('a')
  link.href=url;link.download=filename;link.rel='noopener'
  document.body.appendChild(link)
  try{link.click()}finally{link.remove()}
  message('已產生 PDF '+audit.byteLength+' bytes（'+audit.version+'）並要求瀏覽器下載 '+filename+'；若 Safari 未自動下載，請使用上方「開啟／儲存剛產生的 PDF」連結。'+pageAudit+'；'+advice+'；'+choice.warning+'；紙張選項不代表已實現 1:N 工程比例；已接入文字向量管線；缺字與替代字型仍須核對，未驗證字型、XREF、代理物件、圖元保真及 Safari 下載完成；智慧排版重新嵌入 PDF 後，原 PDF 的可切換圖層可能不保留。')
 }catch(e){
  if(e instanceof ExportTimeoutError){exportInvalidated=true;documentReady=false}
  message('PDF 產生失敗：'+(e instanceof Error?e.message:String(e)))
 }finally{
  window.clearInterval(progressTimer);exporting=false
  fileInput.disabled=exportInvalidated;stopExport.hidden=!exportInvalidated
  exportButton.disabled=!documentReady||loading||exportInvalidated
 }
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
  const entry=document.querySelector<HTMLScriptElement>('script[type=module][src]')?.src
  if(entry&&!assets.some(x=>new URL(x,scope).href===entry))return false
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
      const watchInstalling=()=>{
        const worker=reg.installing
        if(!worker)return
        setOfflineStatus('正在下載完整離線資產…')
        worker.addEventListener('statechange',()=>{
          if(worker.state==='installed'){
            if(navigator.serviceWorker.controller)setOfflineStatus('新版已下載；請關閉所有此網站分頁後重新開啟，再確認快取')
            else void update()
          }
          if(worker.state==='activated')void update()
          if(worker.state==='redundant')setOfflineStatus('離線資產安裝失敗；請連網重新開啟')
        })
      }
      // Attach before awaiting cache inspection: installation may finish during it.
      reg.addEventListener('updatefound',watchInstalling)
      watchInstalling()
      navigator.serviceWorker.addEventListener('controllerchange',()=>{void update()})
      await update()
      if(reg.waiting)setOfflineStatus('新版已下載；請關閉所有此網站分頁後重新開啟，再確認快取')
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

const fontInput=document.getElementById('font-file') as HTMLInputElement
fontInput.addEventListener('change',async()=>{
 if(loading||exporting||fontLoading||exportInvalidated)return
 const files=Array.from(fontInput.files??[])
 if(!files.length)return
 fontLoading=true;resetFileState()
 try{
  await initialize()
  for(const file of files){
   if(!/\.(shx|ttf|otf|woff|ttc)$/i.test(file.name))throw new Error('不支援的字型格式：'+file.name)
   const encoding=(document.getElementById('font-encoding') as HTMLSelectElement).value
   if(file.size>64*1024*1024)throw new Error('單一字型檔上限為 64 MiB')
   const fonts=/\.ttc$/i.test(file.name)?extractTtcFaces(await file.arrayBuffer()).map((face,index)=>({data:face.bytes.buffer as ArrayBuffer,name:file.name.replace(/\.ttc$/i,'')+'-face-'+(index+1)+'.'+face.extension,aliases:[face.name]})):[{data:await file.arrayBuffer(),name:file.name,aliases:undefined}]
   for(const font of fonts){
    const result=await AcApFontUtil.cacheFont(font.data,font.name,font.aliases,encoding||undefined)
    if(result.status!=='Success')throw new Error('字型載入失敗：'+font.name+' '+result.status)
    await AcTrMTextRenderer.getInstance().loadFonts([result.fontName],{scope:'all'})
   }
  }
  await fontSettings.refresh()
  fileInput.value=''
  message('字型已載入本機快取，請重新選擇 DWG。瀏覽器清除資料可能移除字型，仍須離線重啟驗證。')
 }catch(e){message('字型載入失敗：'+String(e))}
 finally{fontLoading=false;fontInput.value=''}
})
