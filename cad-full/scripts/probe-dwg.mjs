// Local-only smoke probe. This does not assert text, layout or reference-PDF fidelity.
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {AcDbDatabase,AcDbDatabaseConverterManager,AcDbFileType} from '@mlightcad/data-model'
import {AcDbLibreDwgMainThreadConverter} from '@mlightcad/libredwg-converter/node'
import {exportDatabaseToPdf} from '@mlightcad/pdf-renderer'
import {PDFDocument} from 'pdf-lib'
import {verifyPdfPageGeometry} from '../src/pdf-layout-geometry.mjs'
if(process.argv.length<4)throw new Error('Provide at least two local DWG paths; files are never uploaded')
AcDbDatabaseConverterManager.instance.register(AcDbFileType.DWG,new AcDbLibreDwgMainThreadConverter())
for(const file of process.argv.slice(2)){
 const started=performance.now();const db=new AcDbDatabase();const bytes=readFileSync(file)
 await db.read(bytes,{readOnly:true},AcDbFileType.DWG)
 const entities=[...db.tables.blockTable.modelSpace.newIterator()]
 if(!entities.length)throw new Error('No model-space entities: '+file)
 const counts={};for(const e of entities)counts[e.constructor.name]=(counts[e.constructor.name]??0)+1
 const pdf=await exportDatabaseToPdf(db,{paper:{widthMm:210,heightMm:297},marginMm:10,fit:'extents',layouts:'current'})
 const output=await PDFDocument.load(pdf)
 if(output.getPageCount()!==1)throw new Error('Expected one smoke-test page')
 const page=output.getPage(0)
 verifyPdfPageGeometry(page.getWidth(),page.getHeight(),{widthMm:210,heightMm:297},10)
 console.log(JSON.stringify({file,sha256:createHash('sha256').update(bytes).digest('hex'),inputBytes:bytes.length,modelEntityCounts:counts,pdfBytes:pdf.length,pagePoints:page.getSize(),elapsedMs:Math.round(performance.now()-started),fidelity:'NOT VERIFIED: no reference PDF or browser glyph provider in this Node probe'}))
}
