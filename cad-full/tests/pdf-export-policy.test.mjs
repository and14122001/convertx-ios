import test from 'node:test'
import assert from 'node:assert/strict'
import {MAX_PDF_PAGE_PT,requirePdfPage,requireSinglePage,requirePaperMargin} from '../src/pdf-export-policy.mjs'
test('PDF page dimensions are finite and bounded',()=>{
 assert.equal(requirePdfPage(595.28,841.89).widthPt,595.28)
 assert.equal(requirePdfPage(MAX_PDF_PAGE_PT,100).widthPt,MAX_PDF_PAGE_PT)
 for(const v of [0,-1,NaN,Infinity,MAX_PDF_PAGE_PT+1])assert.throws(()=>requirePdfPage(v,100))
})
test('single page policy rejects zero, multiple, invalid geometry',()=>{
 const page=(w,h)=>({getWidth:()=>w,getHeight:()=>h})
 const doc=(pages)=>({getPageCount:()=>pages.length,getPage:i=>pages[i]})
 assert.equal(requireSinglePage(doc([page(100,200)])).getWidth(),100)
 assert.throws(()=>requireSinglePage(doc([])),/單頁/)
 assert.throws(()=>requireSinglePage(doc([page(100,200),page(100,200)])),/單頁/)
 assert.throws(()=>requireSinglePage(doc([page(Infinity,200)])),/尺寸/)
})
test('paper margins reject impossible and oversized settings',()=>{
 assert.doesNotThrow(()=>requirePaperMargin({widthMm:210,heightMm:297},10))
 assert.doesNotThrow(()=>requirePaperMargin('extents',10))
 assert.throws(()=>requirePaperMargin({widthMm:20,heightMm:20},10),/留白/)
 assert.throws(()=>requirePaperMargin({widthMm:6000,heightMm:210},10),/14400/)
 assert.throws(()=>requirePaperMargin('extents',NaN),/留白/)
})
