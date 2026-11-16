// Local-only profiling: no drawing bytes or text are written or uploaded.
import {readFileSync} from 'node:fs'
import {inspectFontRequirements,preflightParsedDrawing} from '../src/font-preflight.mjs'
import {AUTO_FONT,applyStyleMappings,requireMappedFonts} from '../src/font-policy.mjs'
import {FontFactory} from '@mlightcad/mtext-renderer'
import {createHash} from 'node:crypto'
import {AcDbDatabase,AcDbDatabaseConverterManager,AcDbFileType} from '@mlightcad/data-model'
import {AcDbLibreDwgMainThreadConverter} from '@mlightcad/libredwg-converter/node'
const autoFont=process.argv.includes('--auto-font')
if(autoFont){const bytes=readFileSync(new URL('../public/fonts/NotoSansTC-Regular.otf',import.meta.url));const font=FontFactory.instance.createFont({name:AUTO_FONT,alias:[AUTO_FONT],type:'mesh',data:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)});for(const char of '醫療平面圖ABC123')if(!font.hasChar(char))throw new Error('Bundled font lacks '+char)}
const bytes=readFileSync(process.argv[2]);const started=performance.now()
class ProfileConverter extends AcDbLibreDwgMainThreadConverter {
 async parse(data){const t=performance.now();const parsed=await super.parse(data);console.error('parseMs='+Math.round(performance.now()-t));if(autoFont&&parsed.model){const report=inspectFontRequirements(parsed.model);const substitutions=requireMappedFonts([...report.requirements.map(f=>f.name),...report.unresolved],{},name=>name===AUTO_FONT,'auto');applyStyleMappings(parsed.model,{},name=>name===AUTO_FONT,'auto');console.log(JSON.stringify({autoFont:AUTO_FONT,requirementCount:report.requirements.length,unresolvedCount:report.unresolved.length,substitutionCount:substitutions.length}));return parsed}if(process.argv.includes('--preflight'))return preflightParsedDrawing(parsed,async()=>{},()=>false,(r,m)=>console.log(JSON.stringify({parseMs:Math.round(performance.now()-t),fontCount:m.length,fonts:m.map(f=>f.key),entityCount:r.entityCount,unresolvedCount:r.unresolved.length,usedStyleCount:r.usedStyleCount,scope:r.scope})));return parsed}
}
AcDbDatabaseConverterManager.instance.register(AcDbFileType.DWG,new ProfileConverter())
const db=new AcDbDatabase()
try{await db.read(bytes,{readOnly:true},AcDbFileType.DWG)}catch(e){if(process.argv.includes('--preflight')&&e.message.includes('字型預檢')){console.error('EXPECTED: stopped before database conversion/render');process.exit(0)}throw e}
const counts={};let blocks=0,total=0
for(const block of db.tables.blockTable.newIterator()){
 blocks++
 for(const e of block.newIterator()){total++;counts[e.constructor.name]=(counts[e.constructor.name]??0)+1}
}
const styles=[...db.tables.textStyleTable.newIterator()].map(s=>({name:s.name,fileName:s.fileName,bigFontFileName:s.bigFontFileName,textStyle:s.textStyle}))
console.log(JSON.stringify({sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,parseAndConvertMs:Math.round(performance.now()-started),blocks,total,counts,...(autoFont?{}:{styles})},null,2))
