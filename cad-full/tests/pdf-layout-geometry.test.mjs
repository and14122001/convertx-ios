import test from 'node:test'
import assert from 'node:assert/strict'
import {uniformPdfPlacement,verifyPdfPageGeometry} from '../src/pdf-layout-geometry.mjs'
test('vector PDF placement fits inside margins without nonuniform distortion',()=>{
 const p=uniformPdfPlacement(900,300,841.89,595.28,10)
 assert.ok(p.factor>0)
 assert.ok(Math.abs(p.width/900-p.height/300)<1e-12)
 assert.ok(p.x>=10*72/25.4-0.001)
 assert.ok(p.y>=10*72/25.4-0.001)
 assert.ok(p.x+p.width<=841.89-10*72/25.4+0.001)
 assert.ok(p.y+p.height<=595.28-10*72/25.4+0.001)
})
test('invalid page geometry and excessive margins fail closed',()=>{
 assert.throws(()=>uniformPdfPlacement(0,200,500,500,10))
 assert.throws(()=>uniformPdfPlacement(100,100,30,30,10))
 assert.throws(()=>uniformPdfPlacement(100,100,500,500,NaN))
 assert.throws(()=>verifyPdfPageGeometry(0,100,'extents'))
 assert.throws(()=>verifyPdfPageGeometry(100,100,{widthMm:210,heightMm:297},10))
 assert.throws(()=>verifyPdfPageGeometry(100,100,{widthMm:15,heightMm:15},10))
})
test('PDF MediaBox accepts exact A4 and rejects paper mismatch',()=>{
 const widthPt=210*72/25.4,heightPt=297*72/25.4
 const p=verifyPdfPageGeometry(widthPt,heightPt,{widthMm:210,heightMm:297},10)
 assert.ok(Math.abs(p.widthMm-210)<1e-9)
 assert.throws(()=>verifyPdfPageGeometry(widthPt,heightPt,{widthMm:297,heightMm:210},10))
})
