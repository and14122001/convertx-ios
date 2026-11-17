import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {uniformPdfPlacement,verifyPdfPageGeometry} from '../src/pdf-layout-geometry.mjs'
const generator=readFileSync(new URL('../scripts/generate-offline-sw.mjs',import.meta.url),'utf8')
test('PDF page tolerance is validated rather than allowing NaN to bypass MediaBox gate',()=>{
 const w=210*72/25.4,h=297*72/25.4
 for(const tolerance of [NaN,Infinity,-0.1,2])assert.throws(()=>verifyPdfPageGeometry(w,h,{widthMm:210,heightMm:297},10,tolerance))
})
test('PDF geometry overflow and nonfinite placement are rejected',()=>{
 assert.throws(()=>uniformPdfPlacement(1e-320,1e-320,1e308,1e308,0))
 assert.throws(()=>uniformPdfPlacement(Number.MAX_VALUE,Number.MAX_VALUE,1e-320,1e-320,0))
})
test('offline precache limits concurrent downloads and waits before deleting a failed cache',()=>{
 assert.match(generator,/Math\.min\(3,ASSETS\.length\)/)
 assert.match(generator,/i\+=3/)
 assert.match(generator,/Promise\.allSettled\(workers\)/)
 assert.match(generator,/await caches\.delete\(CACHE\)/)
 assert.match(generator,/response\.type==='opaque'/)
 assert.ok(generator.indexOf('Promise.allSettled(workers)')<generator.indexOf('await caches.delete(CACHE)'))
})
