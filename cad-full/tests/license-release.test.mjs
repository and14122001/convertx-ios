import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {spawnSync} from 'node:child_process'
const check=new URL('../scripts/check-dist.mjs',import.meta.url)
function run(root,release){return spawnSync(process.execPath,[check.pathname],{env:{...process.env,CAD_DIST_DIR:root,CAD_RELEASE:release?'1':'0'},encoding:'utf8'})}
function fixture(fn){const root=mkdtempSync(join(tmpdir(),'cad-gpl-'));try{mkdirSync(join(root,'assets'));writeFileSync(join(root,'index.html'),'html');return fn(root)}finally{rmSync(root,{recursive:true,force:true})}}
test('release requires GPL license and corresponding-source document',()=>fixture(root=>{
 const result=run(root,true)
 assert.notEqual(result.status,0)
 assert.match(result.stderr,/missing DWG GPL distribution document/)

}))
test('development smoke check does not enforce release-only GPL document paths',()=>fixture(root=>{
 const result=run(root,false)
 assert.doesNotMatch(result.stderr,/missing DWG GPL distribution document/)
}))

test('release rejects placeholder GPL license and short source offer',()=>fixture(root=>{
 mkdirSync(join(root,'legal'))
 writeFileSync(join(root,'legal','GPL-3.0.txt'),'GNU GENERAL PUBLIC LICENSE\\nVersion 3, 29 June 2007')
 writeFileSync(join(root,'legal','DWG-SOURCE.md'),'libredwg 3.15.21 https://example.org')
 const result=run(root,true)
 assert.notEqual(result.status,0)
 assert.match(result.stderr,/GPL-3.0 license text appears incomplete/)
 assert.match(result.stderr,/DWG source offer missing pinned version or retrieval details/)
}))
