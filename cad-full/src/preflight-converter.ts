import {AcDbLibreDwgConverter} from '@mlightcad/libredwg-converter'
import {applyStyleMappings,requireMappedFonts} from './font-policy.mjs'
import {FontManager} from '@mlightcad/mtext-renderer'
import {preflightParsedDrawing,formatFontPreflight} from './font-preflight.mjs'
/** Parse once in the existing WASM Worker; collect diagnostics without blocking geometry preview. */
export class PreflightDwgConverter extends AcDbLibreDwgConverter {
 lastIssue=''
 fontWarning=''
 lastReport: any
 mapping:Record<string,string>={}
 mode='original'
 parseMs=0
 protected async parse(data:ArrayBuffer,timeout?:number){
  this.lastIssue='';this.fontWarning='';this.lastReport=undefined
  const start=performance.now()
  const parsed=await super.parse(data,timeout)
  this.parseMs=performance.now()-start
  try{
   const result=await preflightParsedDrawing(parsed,
    async (names:string[])=>{await FontManager.instance.loadFontsByNames([...names,...Object.values(this.mapping)])},
    (name:string)=>FontManager.instance.isFontLoaded(name),
    (report:any,missing:any[])=>{this.lastReport={report,missingCount:missing.length,parseMs:this.parseMs};this.fontWarning=missing.length||report.unresolved.length?formatFontPreflight(report,missing):''})
   if(this.lastReport&&this.mode!=='original'){
    try{this.lastReport.substitutions=requireMappedFonts([...this.lastReport.report.requirements.map((f:any)=>f.name),...this.lastReport.report.unresolved],this.mapping,(name:string)=>FontManager.instance.isFontLoaded(name),this.mode).filter((f:any)=>f.source!==f.target)}catch(error){this.lastReport.substitutionError=String(error)}
   }
   if(this.mode==='auto'&&this.lastReport?.substitutions?.length&&!this.lastReport.substitutionError)this.fontWarning='已自動替代 '+this.lastReport.substitutions.length+' 個缺少字型／未知來源樣式；內建 Noto Sans TC 或手動對應。字寬與排版可能不同，PDF 會加註；詳見字型預檢明細。'
   if(result.model)applyStyleMappings(result.model,this.mapping,(name:string)=>FontManager.instance.isFontLoaded(name),this.mode)
   return result
  }catch(error){this.lastIssue=(error instanceof Error?error.message:String(error))+'\n解析耗時 '+(this.parseMs/1000).toFixed(1)+' 秒；預覽與 PDF 尚未開始。';throw error}
 }
}
