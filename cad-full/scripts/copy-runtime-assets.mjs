#!/usr/bin/env node
import { copyFileSync, mkdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'

const root=process.env.CAD_DIST_DIR||'dist'
const assets=[
 ['node_modules/@mlightcad/cad-simple-viewer/dist/mtext-renderer-worker.js','assets/mtext-renderer-worker.js'],
 ['node_modules/@mlightcad/libredwg-converter/dist/libredwg-parser-worker.js','assets/libredwg-parser-worker.js'],
 ['node_modules/@mlightcad/libredwg-converter/dist/libredwg-web.wasm','assets/libredwg-web.wasm']
]
for(const [source,target] of assets){
 const output=join(root,target)
 mkdirSync(dirname(output),{recursive:true})
 copyFileSync(source,output)
 if(statSync(output).size===0)throw new Error(`Runtime asset is empty: ${target}`)
 console.log('Copied',target,statSync(output).size+' bytes')
}
