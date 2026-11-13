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
