import {test} from 'node:test'
import assert from 'node:assert/strict'
import {loadAutomaticFont,preparePreviewFont} from '../src/automatic-font-loading.mjs'
import {AUTO_FONT} from '../src/font-policy.mjs'
test('isolated Worker success is not used as main-thread loaded state',async()=>{
 const calls=[];let main=false
 const result=await loadAutomaticFont({loadMain:async names=>{calls.push('main');assert.deepEqual(names,[AUTO_FONT]);main=true;return [{status:'Success'}]},isMainLoaded:()=>main,loadRenderer:async(names,options)=>{calls.push('worker');assert.equal(main,true);assert.equal(options.scope,'all')}})
 assert.deepEqual(calls,['main','worker']);assert.equal(result.mainLoaded,true)
})
test('warm main map avoids another font parse but still requests renderer synchronization',async()=>{
 let worker=0
 await loadAutomaticFont({loadMain:()=>assert.fail('duplicate main parse'),isMainLoaded:()=>true,loadRenderer:async()=>worker++})
 assert.equal(worker,1)
})
test('font preparation errors do not reject geometry preview',async()=>{
 const failed=await preparePreviewFont(()=>loadAutomaticFont({loadMain:async()=>[{status:'FailedToLoad'}],isMainLoaded:()=>false,loadRenderer:()=>assert.fail('not ready')}))
 assert.equal(failed.ready,false);assert.match(failed.warning,/FailedToLoad/);assert.match(failed.warning,/繼續幾何預覽/)
 const workerFailed=await preparePreviewFont(()=>loadAutomaticFont({loadMain:()=>{},isMainLoaded:()=>true,loadRenderer:async()=>{throw new Error('worker error')}}))
 assert.equal(workerFailed.ready,false);assert.match(workerFailed.warning,/worker error/)
})
test('strict export preparation propagates a real load failure',async()=>{
 await assert.rejects(loadAutomaticFont({loadMain:async()=>[{status:'NotFound'}],isMainLoaded:()=>false,loadRenderer:()=>{}}),/主執行緒.*NotFound/)
})
