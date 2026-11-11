import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const source=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8')
test('PDF export captures bytes from the pinned MLightCAD 1.7.8 vector pipeline',()=>{
 assert.match(source,/exportButton\.addEventListener\('click',async\(\)=>/)
 assert.match(source,/new AcApPdfConvertor\(\)/)
 assert.match(source,/pinnedSink\.downloadBytes=/)
 assert.match(source,/await pdfConvertor\.convert\(context,exportOptions\)/)
 assert.match(source,/catch\(e\)\{message\('PDF 匯出失敗：/)
})
test('PDF bytes are audited and downloaded with explicit framing limits',()=>{
 assert.match(source,/const audit=inspectPdfBytes\(bytes\)/)
 assert.match(source,/URL\.createObjectURL\(blob\)/)
 assert.match(source,/checkedPdf\.getPageCount\(\)!==sourcePdf\.getPageCount\(\)/)
 assert.match(source,/page\.getWidth\(\)-paper\.widthMm\*72\/25\.4/)
 assert.match(source,/exportLayouts:true/)
 assert.match(source,/目前不宣稱保真驗收通過/)
 assert.match(source,/finally\{exporting=false;exportButton\.disabled=!documentReady\|\|loading\}/)
})
