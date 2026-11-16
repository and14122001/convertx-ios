import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import vm from 'node:vm'
function worker(){
 const handlers={},deleted=[]
 const context={URL,self:{location:{origin:'https://example.test'},addEventListener:(name,fn)=>handlers[name]=fn,clients:{claim:async()=>{}},skipWaiting(){}},caches:{keys:async()=>['convertx-ios-lite-v7','convertx-ios-lite-v8','convertx-cad-full-123','other-app'],delete:async key=>deleted.push(key)},fetch(){throw Error('unexpected fetch')}}
 vm.runInNewContext(readFileSync(new URL('../../sw.js',import.meta.url),'utf8'),context)
 return {handlers,deleted}
}
test('root SW upgrade preserves CAD and unrelated caches',async()=>{
 const {handlers,deleted}=worker();let done
 handlers.activate({waitUntil:promise=>done=promise});await done
 assert.deepEqual(deleted,['convertx-ios-lite-v7'])
})
test('root SW does not intercept CAD preview navigation or WASM',()=>{
 const {handlers}=worker()
 for(const path of ['cad-test/','cad-test/assets/libredwg-web.wasm','cad-full/'])handlers.fetch({request:{url:'https://example.test/convertx-ios/'+path,method:'GET'},respondWith(){assert.fail('CAD intercepted')}})
})
