#!/usr/bin/env node
import { existsSync, statSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
const root=process.env.CAD_DIST_DIR||'dist'
const required=['sw.js','index.html','assets/mtext-renderer-worker.js','assets/libredwg-parser-worker.js','assets/libredwg-web.wasm']
let failed=false
for(const file of required){
  const path=join(root,file)
  const ok=existsSync(path)&&statSync(path).size>0
  console.log(ok?'PASS':'FAIL',file,ok?statSync(path).size+' bytes':'missing or empty')
  if(!ok)failed=true
}
if(!existsSync(join(root,'assets'))){console.error('FAIL: assets directory missing');failed=true}
else{
  const names=readdirSync(join(root,'assets'))
  const js=names.filter(n=>/\.js$/.test(n)&&n!=='mtext-renderer-worker.js'&&n!=='libredwg-parser-worker.js')
  if(js.length===0){console.error('FAIL: no application JavaScript bundle');failed=true}
  const pdfBundle=js.some(n=>readFileSync(join(root,'assets',n),'utf8').includes('cpdf'))
  console.log(pdfBundle?'PASS':'FAIL','PDF export command in bundled JavaScript')
  if(!pdfBundle)failed=true
}
// A GPL DWG parser is bundled; do not ship a Pages distribution without
// the license and source-offer manifest. These checks do not constitute a
// legal audit of the actual npm tarball or its transitive dependencies.
if(process.env.CAD_RELEASE==='1')for(const file of ['legal/GPL-3.0.txt','legal/DWG-SOURCE.md']){
 const path=join(root,file)
 if(!existsSync(path)||statSync(path).size===0){console.error('FAIL: missing DWG GPL distribution document',file);failed=true}
}
if(!existsSync(join(root,'offline-manifest.json'))){console.error('FAIL: offline-manifest.json missing');failed=true}
if(existsSync(join(root,'sw.js'))){
  const sw=readFileSync(join(root,'sw.js'),'utf8')
  const manifest=sw.match(/const ASSETS=(\[[^;]+\]);/)
  if(!manifest){console.error('FAIL: offline manifest missing');failed=true}
  else{
    let assets=[]
    try{assets=JSON.parse(manifest[1])}catch{console.error('FAIL: invalid offline manifest');failed=true}
    const paths=assets.filter(x=>x!=='./').map(x=>x.replace(/^\.\//,''))
    const manifestPath=join(root,'offline-manifest.json')
    if(existsSync(manifestPath)){
      try{
        const json=JSON.parse(readFileSync(manifestPath,'utf8'))
        const cache=sw.match(/const CACHE=("[^"]+");/)
        if(!cache||json.cacheName!==JSON.parse(cache[1])||JSON.stringify(json.assets)!==JSON.stringify(assets)){
          console.error('FAIL: offline JSON manifest differs from service worker');failed=true
        }
      }catch(e){console.error('FAIL: invalid offline JSON manifest',String(e));failed=true}
    }
    if(new Set(paths).size!==paths.length){console.error('FAIL: duplicate offline manifest entries');failed=true}
    const diskFiles=(dir,prefix='')=>readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?diskFiles(join(dir,entry.name),prefix+entry.name+'/'):[prefix+entry.name])
    const actual=diskFiles(root).filter(x=>x!=='sw.js')
    const missing=actual.filter(x=>!paths.includes(x))
    const stale=paths.filter(x=>!actual.includes(x))
    if(missing.length||stale.length){console.error('FAIL: offline manifest mismatch',{missing,stale});failed=true}
    else console.log('PASS: offline manifest covers all distribution files')
  }
}
if(failed){console.error('CAD offline bundle incomplete; deployment must not proceed');process.exitCode=1}
else console.log('Static asset smoke check passed; browser DWG/PDF functionality remains unverified')
