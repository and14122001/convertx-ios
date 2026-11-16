import test from 'node:test'
import assert from 'node:assert/strict'
import {openVerifiedDocument} from '../src/open-document.mjs'
test('false open result rejects stale document export',async()=>{
 await assert.rejects(openVerifiedDocument({openDocument:async()=>false},'bad.dwg',new ArrayBuffer(0),{}),/禁止匯出先前/)
})
test('open exception is preserved',async()=>{
 await assert.rejects(openVerifiedDocument({openDocument:async()=>{throw new Error('WASM failed')}},'bad.dwg',new ArrayBuffer(0),{}),/WASM failed/)
})
test('successful open forwards exact local bytes and options',async()=>{
 const bytes=new ArrayBuffer(10),options={minimumChunkSize:1000}
 await openVerifiedDocument({openDocument:async(name,data,opts)=>{assert.equal(name,'local.dwg');assert.equal(data,bytes);assert.equal(opts,options);return true}},'local.dwg',bytes,options)
})
