import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const source=readFileSync(new URL('../scripts/check-dist.mjs',import.meta.url),'utf8')
const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8')
test('production bundle gate checks current PDF Blob path, not removed cpdf command',()=>{
 assert.match(source,/source\.includes\('application\/pdf'\)/)
 assert.match(source,/source\.includes\('createObjectURL'\)/)
 assert.doesNotMatch(source,/includes\('cpdf'\)/)
 assert.match(main,/type:'application\/pdf'/)
 assert.match(main,/URL\.createObjectURL\(blob\)/)
})
test('distribution still requires worker WASM and full offline manifest',()=>{
 assert.match(source,/assets\/libredwg-web\.wasm/)
 assert.match(source,/offline-manifest\.json/)
 assert.match(source,/missing,stale/)
})
