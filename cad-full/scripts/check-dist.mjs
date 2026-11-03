#!/usr/bin/env node
import { existsSync, statSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
const root='dist'
const required=['index.html','assets/mtext-renderer-worker.js','assets/libredwg-parser-worker.js','assets/libredwg-web.wasm']
let failed=false
for(const file of required){
  const path=join(root,file)
  const ok=existsSync(path)&&statSync(path).size>0
  console.log(ok?'PASS':'FAIL',file,ok?statSync(path).size+' bytes':'missing or empty')
  if(!ok)failed=true
}
if(existsSync(join(root,'assets'))){
  const names=readdirSync(join(root,'assets'))
  const js=names.filter(n=>/\.js$/.test(n)&&n!=='mtext-renderer-worker.js'&&n!=='libredwg-parser-worker.js')
  if(js.length===0){console.error('FAIL: no application JavaScript bundle');failed=true}
  const pdfBundle=js.some(n=>readFileSync(join(root,'assets',n),'utf8').includes('cpdf'))
  console.log(pdfBundle?'PASS':'WARN','PDF export command in bundled JavaScript')
}
if(failed){console.error('CAD offline bundle incomplete; deployment must not proceed');process.exitCode=1}
else console.log('Static asset smoke check passed; browser DWG/PDF functionality remains unverified')
