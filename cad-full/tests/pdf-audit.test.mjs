import assert from 'node:assert/strict'
import {test} from 'node:test'
import {inspectPdfBytes} from '../src/pdf-audit.mjs'
const bytes=s=>new TextEncoder().encode(s)
const valid='%PDF-1.7\n1 0 obj<</Type/Catalog>>endobj\nstartxref\n0\n%%EOF\n'
test('PDF basic signature and EOF accepted without claiming page fidelity',()=>{
 const result=inspectPdfBytes(bytes(valid))
 assert.equal(result.version,'1.7')
 assert.equal(result.byteLength,bytes(valid).length)
 assert.match(result.warnings.join(' '),/MediaBox/)
})
test('empty and truncated PDF rejected',()=>{
 assert.throws(()=>inspectPdfBytes(bytes('')),/過短/)
 assert.throws(()=>inspectPdfBytes(bytes(valid.slice(0,-6))),/結尾標記/)
})
test('wrong signature rejected',()=>assert.throws(()=>inspectPdfBytes(bytes('NOTPDF'+valid)),/檔頭/))
test('PDF 2.0 recognized',()=>assert.equal(inspectPdfBytes(bytes(valid.replace('%PDF-1.7','%PDF-2.0'))).version,'2.0'))
test('trailing garbage after EOF rejected',()=>assert.throws(()=>inspectPdfBytes(bytes(valid+'garbage')),/結尾標記/))
