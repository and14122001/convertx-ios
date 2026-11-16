import {AUTO_FONT} from './font-policy.mjs'
/** Worker font maps and the main-thread preflight/PDF map are separate isolates. */
export async function loadAutomaticFont({loadMain,isMainLoaded,loadRenderer}){
 if(!isMainLoaded(AUTO_FONT)){
  const results=await loadMain([AUTO_FONT])
  if(!isMainLoaded(AUTO_FONT))throw new Error('主執行緒字型載入未成功：'+JSON.stringify(results??[]))
 }
 // AcTrMTextRenderer returns names dispatched, not a per-worker success report.
 await loadRenderer([AUTO_FONT],{scope:'all'})
 return {font:AUTO_FONT,mainLoaded:true,rendererRequestCompleted:true}
}
/** Font preparation failures must not turn an otherwise readable drawing into open failure. */
export async function preparePreviewFont(load){
 try{return {ready:true,details:await load(),warning:''}}
 catch(error){return {ready:false,warning:'替代字型準備未完成：'+String(error instanceof Error?error.message:error)+'；繼續幾何預覽，PDF 匯出前會重新檢查。'}}
}
