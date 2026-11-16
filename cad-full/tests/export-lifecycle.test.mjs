import test from 'node:test'
import assert from 'node:assert/strict'
import {withDeadline,requireRenderIdle,ExportTimeoutError,missingFontMessage} from '../src/export-lifecycle.mjs'
test('export does not start before deferred viewer jobs finish',async()=>{
 const events=[]
 await requireRenderIdle({waitUntilIdle:async()=>{events.push('render');await new Promise(r=>setTimeout(r,5));events.push('idle');return true}},30)
 events.push('export');assert.deepEqual(events,['render','idle','export'])
})
test('viewer false and never-settling promises fail with a bounded error',async()=>{
 await assert.rejects(requireRenderIdle({waitUntilIdle:async()=>false},5),ExportTimeoutError)
 await assert.rejects(withDeadline(()=>new Promise(()=>{}),5,'PDF'),ExportTimeoutError)
})
test('timed-out render cannot resume caller download after a late success',async()=>{
 let resolve,downloads=0
 const work=new Promise(r=>resolve=r)
 await assert.rejects((async()=>{await withDeadline(()=>work,5,'PDF');downloads++})(),ExportTimeoutError)
 resolve(new Uint8Array([1]));await new Promise(r=>setTimeout(r,5));assert.equal(downloads,0)
})
test('successful result and parser failures are preserved',async()=>{
 assert.equal(await withDeadline(async()=>42,30,'PDF'),42)
 await assert.rejects(withDeadline(async()=>{throw Error('original error')},30,'PDF'),/original error/)
})
test('font warning is actionable and never treats an encoding as a font',()=>{
 assert.equal(missingFontMessage([]),'')
 assert.match(missingFontMessage(['hztxt','hztxt'],['中']),/hztxt；缺字 中/)
 assert.match(missingFontMessage(['hztxt']),/Big5 只設定編碼/)
})
