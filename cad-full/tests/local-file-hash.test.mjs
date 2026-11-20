import test from 'node:test'
import assert from 'node:assert/strict'
import {createHash,webcrypto} from 'node:crypto'
import {readFileSync} from 'node:fs'
import {sha256Hex} from '../src/local-file-hash.mjs'
const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8')
test('local SHA-256 matches Node reference for ArrayBuffer and subarray',async()=>{
 const source=new TextEncoder().encode('prefix-DWG-2026-suffix')
 const view=source.subarray(7,15)
 const expected=createHash('sha256').update(view).digest('hex')
 assert.equal(await sha256Hex(view,webcrypto.subtle),expected)
 assert.equal(await sha256Hex(view.slice().buffer,webcrypto.subtle),expected)
 assert.equal((await sha256Hex(view,webcrypto.subtle)).length,64)
})
test('invalid buffers and unavailable WebCrypto fail explicitly',async()=>{
 await assert.rejects(sha256Hex('not binary',webcrypto.subtle),TypeError)
 await assert.rejects(sha256Hex(new ArrayBuffer(0),null),/不支援/)
})
test('file hashes stay local and stale PDF link is hidden for a new DWG',()=>{
 assert.match(main,/lastDwgHash=await sha256Hex\(bytes\)/)
 assert.match(main,/pdfHash=await sha256Hex\(bytes\)/)
 assert.match(main,/pdfOpenLink.hidden=true/)
 assert.match(main,/SHA-256 僅驗證位元組身分，不代表圖元保真/)
 assert.ok(main.indexOf('const pdfHash=')<main.indexOf('const blob=new Blob'))
})
