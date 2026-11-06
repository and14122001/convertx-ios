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

test('updates do not forcibly take over active CAD sessions',()=>fixture(root=>{const sw=generate(root);assert.doesNotMatch(sw,/self\.skipWaiting\(/);assert.match(sw,/self\.addEventListener\('activate'/)}))

test('distribution check rejects files missing from offline manifest',()=>fixture(root=>{
 for(const name of ['mtext-renderer-worker.js','libredwg-parser-worker.js','app.js'])writeFileSync(join(root,'assets',name),name==='app.js'?'cpdf':'worker')
 generate(root)
 writeFileSync(join(root,'assets','late-chunk.js'),'late chunk')
 const check=new URL('../scripts/check-dist.mjs',import.meta.url)
 const result=spawnSync(process.execPath,[check.pathname],{env:{...process.env,CAD_DIST_DIR:root},encoding:'utf8'})
 assert.notEqual(result.status,0)
 assert.match(result.stderr,/offline manifest mismatch/)
}))

test('distribution check reports missing assets directory without crashing',()=>fixture(root=>{
 generate(root)
 rmSync(join(root,'assets'),{recursive:true,force:true})
 const check=new URL('../scripts/check-dist.mjs',import.meta.url)
 const result=spawnSync(process.execPath,[check.pathname],{env:{...process.env,CAD_DIST_DIR:root},encoding:'utf8'})
 assert.notEqual(result.status,0)
 assert.match(result.stderr,/assets directory missing/)
 assert.doesNotMatch(result.stderr,/ENOENT/)
}))

test('offline manifest includes itself and lazy-loaded PDF chunk',()=>fixture(root=>{
 writeFileSync(join(root,'assets','pdf-lazy.js'),'PDF module')
 const sw=generate(root)
 const manifest=JSON.parse(readFileSync(join(root,'offline-manifest.json'),'utf8'))
 assert.match(manifest.cacheName,/^convertx-cad-full-[0-9a-f]{16}$/)
 assert.ok(manifest.assets.includes('./assets/pdf-lazy.js'))
 assert.ok(manifest.assets.includes('./offline-manifest.json'))
 assert.ok(sw.includes('./offline-manifest.json'))
}))
test('offline manifest is deterministic across repeat builds',()=>fixture(root=>{
 generate(root)
 const first=readFileSync(join(root,'offline-manifest.json'),'utf8')
 generate(root)
 assert.equal(readFileSync(join(root,'offline-manifest.json'),'utf8'),first)
}))

test('distribution check rejects mismatched JSON manifest cache version',()=>fixture(root=>{
 for(const name of ['mtext-renderer-worker.js','libredwg-parser-worker.js','app.js'])writeFileSync(join(root,'assets',name),name==='app.js'?'cpdf':'worker')
 generate(root)
 const path=join(root,'offline-manifest.json')
 const manifest=JSON.parse(readFileSync(path,'utf8'))
 manifest.cacheName='convertx-cad-full-0000000000000000'
 writeFileSync(path,JSON.stringify(manifest))
 const check=new URL('../scripts/check-dist.mjs',import.meta.url)
 const result=spawnSync(process.execPath,[check.pathname],{env:{...process.env,CAD_DIST_DIR:root},encoding:'utf8'})
 assert.notEqual(result.status,0)
 assert.match(result.stderr,/offline JSON manifest differs from service worker/)
}))
test('distribution check accepts matching complete offline assets',()=>fixture(root=>{
 for(const name of ['mtext-renderer-worker.js','libredwg-parser-worker.js','app.js'])writeFileSync(join(root,'assets',name),name==='app.js'?'cpdf':'worker')
 generate(root)
 const check=new URL('../scripts/check-dist.mjs',import.meta.url)
 const result=spawnSync(process.execPath,[check.pathname],{env:{...process.env,CAD_DIST_DIR:root},encoding:'utf8'})
 assert.equal(result.status,0,result.stderr)
 assert.match(result.stdout,/Static asset smoke check passed/)
}))

test('nested files ending with sw.js remain in offline manifest',()=>fixture(root=>{
 writeFileSync(join(root,'assets','viewer-sw.js'),'worker')
 generate(root)
 const manifest=JSON.parse(readFileSync(join(root,'offline-manifest.json'),'utf8'))
 assert.ok(manifest.assets.includes('./assets/viewer-sw.js'))
}))

test('distribution check rejects duplicate offline asset entries',()=>fixture(root=>{
 for(const name of ['mtext-renderer-worker.js','libredwg-parser-worker.js','app.js'])writeFileSync(join(root,'assets',name),name==='app.js'?'cpdf':'worker')
 generate(root)
 const swPath=join(root,'sw.js')
 const sw=readFileSync(swPath,'utf8')
 const match=sw.match(/const ASSETS=(\[[^;]+\]);/)
 assert.ok(match)
 const assets=JSON.parse(match[1])
 assets.push(assets[1])
 writeFileSync(swPath,sw.replace(match[0],'const ASSETS='+JSON.stringify(assets)+';'))
 const manifestPath=join(root,'offline-manifest.json')
 const manifest=JSON.parse(readFileSync(manifestPath,'utf8'))
 manifest.assets=assets
 writeFileSync(manifestPath,JSON.stringify(manifest))
 const check=new URL('../scripts/check-dist.mjs',import.meta.url)
 const result=spawnSync(process.execPath,[check.pathname],{env:{...process.env,CAD_DIST_DIR:root},encoding:'utf8'})
 assert.notEqual(result.status,0)
 assert.match(result.stderr,/duplicate offline manifest entries/)
}))
