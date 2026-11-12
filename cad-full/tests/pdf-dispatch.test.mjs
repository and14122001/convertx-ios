import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const source=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8')
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'))
test('PDF export uses native renderer and active database, not command dispatch',()=>{
 assert.match(source,/await exportDatabaseToPdf\(db,/)
 assert.match(source,/AcApDocManager\.instance\.context\.doc\.database/)
 assert.doesNotMatch(source,/sendStringToExecute\('cpdf'\)/)
})
test('PDF export validates bytes before browser download',()=>{
 assert.match(source,/inspectPdfBytes\(bytes\)/)
 assert.match(source,/new Blob\(\[new Uint8Array\(bytes\)\]/)
 assert.match(source,/URL\.revokeObjectURL\(url\)/)
})
test('PDF export does not silently assert fidelity or paper scale',()=>{
 assert.match(source,/未套用實際紙張比例/)
 assert.match(source,/未驗證字型、XREF、圖元保真及 Safari 下載完成/)
})
test('PDF renderer is pinned to viewer release',()=>{
 assert.equal(pkg.dependencies['@mlightcad/pdf-renderer'],pkg.dependencies['@mlightcad/cad-simple-viewer'])
})

test('PDF filename strips only final CAD extension',()=>{
 assert.match(source,/lastFileName\.replace\(\/\\\.\(dwg\|dxf\)\$\/i,''\)/)
 assert.equal('drawing.DWG'.replace(/\.(dwg|dxf)$/i,'')+'.pdf','drawing.pdf')
 assert.equal('plan.v2.dwg'.replace(/\.(dwg|dxf)$/i,'')+'.pdf','plan.v2.pdf')
})
