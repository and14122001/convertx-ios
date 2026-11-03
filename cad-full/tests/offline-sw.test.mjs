import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
const script=new URL('../scripts/generate-offline-sw.mjs',import.meta.url)
function fixture(fn){
 const root=mkdtempSync(join(tmpdir(),'convertx-sw-'))
 try{mkdirSync(join(root,'assets'));writeFileSync(join(root,'index.html'),'<h1>CAD</h1>');writeFileSync(join(root,'assets','libredwg-web.wasm'),'wasm');return fn(root)}
 finally{rmSync(root,{recursive:true,force:true})}
}
function generate(root){
 const result=spawnSync(process.execPath,[script.pathname],{env:{...process.env,CAD_DIST_DIR:root},encoding:'utf8'})
 assert.equal(result.status,0,result.stderr)
 return readFileSync(join(root,'sw.js'),'utf8')
}
test('service worker precaches HTML and DWG WASM',()=>fixture(root=>{
 const sw=generate(root)
 assert.match(sw,/\.\/index\.html/)
 assert.match(sw,/libredwg-web\.wasm/)
 assert.match(sw,/cache\.match\(event\.request\)/)
}))
test('cache version changes with bundle contents',()=>fixture(root=>{
 const first=generate(root)
 writeFileSync(join(root,'assets','libredwg-web.wasm'),'changed wasm')
 const second=generate(root)
 assert.notEqual(first.match(/const CACHE="([^"]+)"/)?.[1],second.match(/const CACHE="([^"]+)"/)?.[1])
}))
test('repeat build produces identical cache version',()=>fixture(root=>{
 assert.equal(generate(root),generate(root))
}))

test('generator rejects missing entry HTML',()=>fixture(root=>{
 rmSync(join(root,'index.html'))
 const result=spawnSync(process.execPath,[script.pathname],{env:{...process.env,CAD_DIST_DIR:root},encoding:'utf8'})
 assert.notEqual(result.status,0)
 assert.match(result.stderr,/index\.html/)
}))
test('service worker must not match unrelated caches',()=>fixture(root=>{
 const sw=generate(root)
 assert.match(sw,/caches\.open\(CACHE\)/)
 assert.doesNotMatch(sw,/caches\.match\(event\.request\)/)
}))

test('service worker only intercepts requests inside its registration scope',()=>fixture(root=>{
 const sw=generate(root)
 assert.match(sw,/event\.request\.url\.startsWith\(self\.registration\.scope\)/)
 assert.doesNotMatch(sw,/new URL\(event\.request\.url\)\.origin/)
}))

test('failed installation cleans incomplete cache',()=>fixture(root=>{const sw=generate(root);assert.match(sw,/catch\(err\)\{await caches\.delete\(CACHE\);throw err\}/)}))
