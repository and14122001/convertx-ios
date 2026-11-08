import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const source=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8')
test('PDF command dispatch awaits asynchronous rejection',()=>{
 assert.match(source,/exportButton\.addEventListener\('click',async\(\)=>/)
 assert.match(source,/await Promise\.resolve\(AcApDocManager\.instance\.sendStringToExecute\('cpdf'\)\)/)
 assert.match(source,/catch\(e\)\{message\('PDF 匯出指令失敗：/)
})
test('PDF command does not claim downloaded bytes',()=>{
 assert.match(source,/尚未取得輸出位元組、頁面尺寸或下載完成證據/)
 assert.match(source,/finally\{exporting=false;exportButton\.disabled=!documentReady\|\|loading\}/)
})
