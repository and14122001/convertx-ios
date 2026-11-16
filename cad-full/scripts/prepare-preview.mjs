import {mkdirSync,cpSync,writeFileSync,readFileSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()
mkdirSync('_site',{recursive:true})
for(const file of ['index.html','cad.html','data.html','svg.html','sw.js','manifest.webmanifest'])cpSync(file,'_site/'+file)
cpSync('cad-full/dist','_site/cad-test',{recursive:true})
mkdirSync('_site/cad-full',{recursive:true})
writeFileSync('_site/cad-full/index.html','<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=../cad-test/"><a href="../cad-test/">開啟 DWG→PDF 測試版</a></html>')
writeFileSync('_site/.nojekyll','')
writeFileSync('_site/cad-test/build-info.json',JSON.stringify({commit:sha,channel:'preview',formalAcceptance:false}))
const path='_site/cad-test/index.html'
let html=readFileSync(path,'utf8')
html=html.replace('<body>','<body><aside style="padding:12px;background:#78350f;color:white">驗證測試版 · '+sha.slice(0,7)+' · 尚未完成 iPhone／工程圖保真驗收。<a style="color:white" href="./legal/DWG-SOURCE.md">授權與原始碼</a></aside>')
writeFileSync(path,html)
