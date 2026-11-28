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
 assert.match(source,/const previousPdfUrl=retainedPdfUrl/)
 assert.match(source,/retainedPdfUrl=url/)
 assert.match(source,/if\(previousPdfUrl\)URL\.revokeObjectURL\(previousPdfUrl\)/)
 assert.ok(source.indexOf('const verifiedDoc=')<source.indexOf('retainedPdfUrl=url'))
 assert.doesNotMatch(source,/URL\.revokeObjectURL\(url\)/)
})
test('PDF export does not silently assert fidelity or paper scale',()=>{
 assert.match(source,/紙張選項不代表已實現 1:N 工程比例/)
 assert.match(source,/未驗證字型、XREF、代理物件、圖元保真及 Safari 下載完成/)
})
test('PDF renderer is pinned to viewer release',()=>{
 assert.equal(pkg.dependencies['@mlightcad/pdf-renderer'],pkg.dependencies['@mlightcad/cad-simple-viewer'])
})

test('PDF filename strips only final CAD extension',()=>{
 assert.match(source,/lastFileName\.replace\(\/\\\.\(dwg\|dxf\)\$\/i,''\)/)
 assert.equal('drawing.DWG'.replace(/\.(dwg|dxf)$/i,'')+'.pdf','drawing.pdf')
 assert.equal('plan.v2.dwg'.replace(/\.(dwg|dxf)$/i,'')+'.pdf','plan.v2.pdf')
})

test('paper presets and vector glyph provider are wired',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')
 assert.match(html,/id="paper-choice"/)
 assert.match(source,/resolvePaper\(paperChoice\.value,paperOrientation\.value/)
 assert.match(html,/value="a0"/)
 assert.match(html,/value="ansi-e"/)
 assert.match(html,/value="arch-e"/)
 assert.match(source,/createViewerPdfGlyphProvider/)
 assert.match(source,/glyphFailures.length/)
 assert.match(source,/fontMapping: AcApSettingManager\.instance\.fontMapping/)
})
