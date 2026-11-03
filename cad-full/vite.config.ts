import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
const copy=(src:string)=>({src,dest:'assets',rename:{stripBase:true}})
export default defineConfig({
  base:'./',
  build:{outDir:'dist',modulePreload:false},
  plugins:[viteStaticCopy({targets:[
    copy('node_modules/@mlightcad/cad-simple-viewer/dist/mtext-renderer-worker.js'),
    copy('node_modules/@mlightcad/libredwg-converter/dist/libredwg-parser-worker.js'),
    copy('node_modules/@mlightcad/libredwg-converter/dist/libredwg-web.wasm')
  ]})]
})
