import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')
test('mobile workspace uses viewport-aware flexible layout without hardcoded header subtraction',()=>{
 assert.match(html,/min-height:100dvh/)
 assert.match(html,/@media\(max-width:700px\)/)
 assert.match(html,/#viewer\{flex:1 1 auto/)
 assert.doesNotMatch(html,/calc\(100dvh\s*-\s*145px\)/)
})
test('file chooser remains visible and usable in narrow viewport',()=>{
 assert.match(html,/header input\[type=file\]/)
 assert.match(html,/box-sizing:border-box/)
 assert.match(html,/overflow-x:hidden/)
 assert.match(html,/overscroll-behavior-y:contain/)
 assert.match(html,/id="file" type="file"/)
})
