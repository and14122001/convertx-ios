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
 assert.match(result.stderr,/missing DWG GPL distribution document legal\/GPL-3\.0\.txt/)
 assert.match(result.stderr,/missing DWG GPL distribution document legal\/DWG-SOURCE\.md/)
}))
test('development smoke check does not enforce release-only GPL document paths',()=>fixture(root=>{
 const result=run(root,false)
 assert.doesNotMatch(result.stderr,/missing DWG GPL distribution document/)
}))
