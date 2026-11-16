import {test} from 'node:test'
import assert from 'node:assert/strict'
import {cleanMappings,resolveFont,mapGlyphStyle,mapInlineFonts,requireMappedFonts,applyStyleMappings} from '../src/font-policy.mjs'
const loaded=n=>['replacement','simplex','Light'].includes(n)
test('case/path aliases preserve distinct font identities and prevent prototype keys',()=>{
 const map=cleanMappings(JSON.parse('{"SIMPLEX.shx":"replacement","__proto__":"bad","simplex1":"Light"}'))
 assert.equal(map.simplex,'replacement');assert.equal(map.simplex1,'Light');assert.equal(map.__proto__,undefined)
 assert.equal(resolveFont('C:/fonts/SIMPLEX.SHX',map,loaded),'simplex')
 assert.throws(()=>resolveFont('simplex1',map,loaded,'original'),/缺少/)
 assert.equal(resolveFont('simplex1',map,loaded,'substitute'),'Light')
})
test('explicit replacement requires available target, does not allow unmapped defaults',()=>{
 assert.throws(()=>resolveFont('missing',{missing:'absent'},loaded,'substitute'),/缺少/)
 assert.throws(()=>requireMappedFonts(['missing'],{},loaded,'substitute'),/缺少/)
})
test('primary/bigfont and MTEXT inline font overrides use explicit substitutions',()=>{
 const map={danny:'replacement',chineset:'Light'}
 assert.deepEqual(mapGlyphStyle({font:'danny.shx',bigFont:'chineset.shx',widthFactor:0.7},map,loaded,'substitute'),{font:'replacement',bigFont:'Light',widthFactor:0.7})
 assert.equal(mapInlineFonts('A{\\fDANNY.shx|b1|i0;B}',map,loaded,'substitute'),'A{\\freplacement|b1|i0;B}')
 assert.throws(()=>mapInlineFonts('\\funknown;X',map,loaded,'substitute'),/缺少/)
})
test('decoded STYLE edits require substitute mode and an explicit mapping; empty style can be mapped by name',()=>{
 const model={tables:{STYLE:{entries:[{name:'x',font:'danny'},{name:'UnknownStyle',font:''}]}}}
 applyStyleMappings(model,{danny:'replacement',unknownstyle:'Light'},loaded,'original');assert.equal(model.tables.STYLE.entries[0].font,'danny')
 applyStyleMappings(model,{danny:'replacement',unknownstyle:'Light'},loaded,'substitute');assert.equal(model.tables.STYLE.entries[0].font,'replacement');assert.equal(model.tables.STYLE.entries[1].font,'Light')
})

test('font settings catalog stays in the deployed same-origin fonts directory',async()=>{
 const {readFile}=await import('node:fs/promises')
 const source=await readFile(new URL('../src/font-settings.ts',import.meta.url),'utf8')
 assert.match(source,/new URL\('\.\/fonts\/',location.href\)/)
 const catalog=JSON.parse(await readFile(new URL('../public/fonts/fonts.json',import.meta.url),'utf8'))
 assert.ok(catalog)
})
