import {AcDbLibreDwgConverter} from '@mlightcad/libredwg-converter'
import {FontManager} from '@mlightcad/mtext-renderer'
import {preflightParsedDrawing} from './font-preflight.mjs'
/** Parse once in the existing WASM Worker; gate before DB/block/glyph expansion. */
export class PreflightDwgConverter extends AcDbLibreDwgConverter {
 lastIssue=''
 lastReport: unknown
 parseMs=0
 protected async parse(data:ArrayBuffer,timeout?:number){
  this.lastIssue='';this.lastReport=undefined
  const start=performance.now()
  const parsed=await super.parse(data,timeout)
  this.parseMs=performance.now()-start
  try{
   return await preflightParsedDrawing(parsed,
    async (names:string[])=>{await FontManager.instance.loadFontsByNames(names)},
    (name:string)=>FontManager.instance.isFontLoaded(name),
    (report:unknown,missing:unknown[])=>{this.lastReport={report,missingCount:missing.length,parseMs:this.parseMs}})
  }catch(error){this.lastIssue=(error instanceof Error?error.message:String(error))+'\n解析耗時 '+(this.parseMs/1000).toFixed(1)+' 秒；預覽與 PDF 尚未開始。';throw error}
 }
}
