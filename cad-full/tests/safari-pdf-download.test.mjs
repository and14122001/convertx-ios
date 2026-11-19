import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8')
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')
test('iPhone Safari exposes a manual PDF open/save fallback',()=>{
 assert.match(html,/<a id="pdf-open" hidden[^>]*target="_blank"/)
 assert.match(html,/Safari 可使用分享→儲存到檔案/)
 assert.match(main,/pdfOpenLink\.href=url/)
 assert.match(main,/pdfOpenLink\.download=filename/)
 assert.match(main,/pdfOpenLink\.hidden=false/)
})
test('PDF URL stays alive until a replacement PDF is available',()=>{
 assert.match(main,/retainedPdfUrl=url/)
 assert.match(main,/if\(previousPdfUrl\)URL\.revokeObjectURL\(previousPdfUrl\)/)
 assert.doesNotMatch(main,/setTimeout\(\(\)=>URL\.revokeObjectURL\(url\),60000\)/)
 assert.ok(main.indexOf('const verifiedDoc=')<main.indexOf('retainedPdfUrl=url'))
})
test('auto paper recommendation is subject to same physical size and margin gate',()=>{
 assert.match(main,/selectedPaper=recommended\.paper\s*\/\/ Auto recommendations must pass[^\n]*\n\s*requirePaperMargin\(selectedPaper,marginMm\)/)
 assert.match(main,/requirePaperMargin\(selectedPaper,marginMm\)\s*const placement=uniformPdfPlacement/)
})
