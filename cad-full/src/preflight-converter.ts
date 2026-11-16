import {AcDbLibreDwgConverter} from '@mlightcad/libredwg-converter'
import {FontManager} from '@mlightcad/mtext-renderer'
import {preflightParsedDrawing,formatFontPreflight} from './font-preflight.mjs'
/** Parse once in the existing WASM Worker; collect diagnostics without blocking geometry preview. */
export class PreflightDwgConverter extends AcDbLibreDwgConverter {
 lastIssue=''
 fontWarning=''
 lastReport: unknown
 parseMs=0
 protected async parse(data:ArrayBuffer,timeout?:number){
  this.lastIssue='';this.fontWarning='';this.lastReport=undefined
  const start=performance.now()
  const parsed=await super.parse(data,timeout)
  this.parseMs=performance.now()-start
  try{
   return await preflightParsedDrawing(parsed,
    async (names:string[])=>{await FontManager.instance.loadFontsByNames(names)},
    (name:string)=>FontManager.instance.isFontLoaded(name),
    (report:any,missing:any[])=>{this.lastReport={report,missingCount:missing.length,parseMs:this.parseMs};this.fontWarning=missing.length||report.unresolved.length?formatFontPreflight(report,missing):''})
  }catch(error){this.lastIssue=(error instanceof Error?error.message:String(error))+'\n解析耗時 '+(this.parseMs/1000).toFixed(1)+' 秒；預覽與 PDF 尚未開始。';throw error}
 }
}
