import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {recommendLayout} from '../src/smart-layout.mjs'
const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8')
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')
test('automatic landscape and portrait recommendation from drawable geometry',()=>{
 const wide=recommendLayout(900,300,10)
 const tall=recommendLayout(300,900,10)
 assert.equal(wide.orientation,'landscape')
 assert.equal(tall.orientation,'portrait')
 assert.ok(wide.occupancy>0&&wide.occupancy<=1)
 assert.ok(tall.occupancy>0&&tall.occupancy<=1)
})
test('automatic recommendation never infers CAD unit',()=>{
 assert.match(main,/PDFDocument\.load\(measurement\)/)
 assert.match(main,/page\.getWidth\(\),h=page\.getHeight\(\)/)
 assert.match(main,/paper:'extents'/)
 assert.match(main,/marginMm,/)
 assert.doesNotMatch(main,/db\.extmin|db\.extmax/)
})
test('default margin and automatic mode are visible',()=>{
 assert.match(html,/<option value="auto" selected>/)
 assert.match(html,/id="paper-margin"[^>]+value="10"/)
 assert.match(html,/id="layout-advice"/)
})
test('invalid geometry and margin rejected',()=>{
 assert.throws(()=>recommendLayout(0,10))
 assert.throws(()=>recommendLayout(NaN,10))
 assert.throws(()=>recommendLayout(10,10,-1))
 assert.throws(()=>recommendLayout(10,10,101))
})

test('vector composition supports uniform upscaling and 10mm inset',()=>{
 assert.match(main,/dst\.embedPdfPages\(\[src\.getPage\(0\)\]\)/)
 assert.match(main,/Math\.min\(\(widthPt-2\*inset\)\/embedded\.width/)
 assert.match(main,/out\.drawPage\(embedded,/)
 assert.match(main,/marginMm\*72\/25\.4/)
})

test('generated PDF page dimensions are checked before download',()=>{
 assert.match(main,/verifiedDoc=await PDFDocument\.load\(bytes\)/)
 assert.match(main,/actualWidthMm=verifiedPage\.getWidth\(\)\*25\.4\/72/)
 assert.match(main,/Math\.abs\(actualWidthMm-selectedPaper\.widthMm\)>0\.1/)
 assert.ok(main.indexOf('const verifiedDoc=')<main.indexOf('const blob=new Blob'))
})
test('rendered page is not falsely called precise CAD geometry',()=>{
 assert.match(main,/含渲染留白，非精確圖元邊界/)
 assert.throws(()=>recommendLayout(1e-320,1e308))
})
