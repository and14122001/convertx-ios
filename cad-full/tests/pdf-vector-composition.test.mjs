import test from 'node:test'
import assert from 'node:assert/strict'
import {PDFDocument, PDFName, PDFRawStream} from 'pdf-lib'
import {uniformPdfPlacement,verifyPdfPageGeometry} from '../src/pdf-layout-geometry.mjs'
test('real pdf-lib embeds native vector page, survives save/reload with A4 margins',async()=>{
 const source=await PDFDocument.create()
 source.addPage([900,300]).drawLine({start:{x:0,y:0},end:{x:900,y:300},thickness:1})
 const loaded=await PDFDocument.load(await source.save())
 const out=await PDFDocument.create()
 const [embedded]=await out.embedPages([loaded.getPage(0)])
 const width=297*72/25.4,height=210*72/25.4
 const placement=uniformPdfPlacement(embedded.width,embedded.height,width,height,10)
 out.addPage([width,height]).drawPage(embedded,placement)
 const result=await PDFDocument.load(await out.save())
 assert.equal(result.getPageCount(),1)
 verifyPdfPageGeometry(result.getPage(0).getWidth(),result.getPage(0).getHeight(),{widthMm:297,heightMm:210},10)
 const streams=result.context.enumerateIndirectObjects().map(([,obj])=>obj).filter(obj=>obj instanceof PDFRawStream)
 assert.ok(streams.some(obj=>obj.dict.get(PDFName.of('Subtype'))===PDFName.of('Form')))
 assert.ok(!streams.some(obj=>obj.dict.get(PDFName.of('Subtype'))===PDFName.of('Image')))
 assert.ok(placement.x>=10*72/25.4-1e-8)
 assert.ok(placement.y>=10*72/25.4-1e-8)
})
