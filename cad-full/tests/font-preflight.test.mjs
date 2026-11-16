import {test} from 'node:test'
import assert from 'node:assert/strict'
import {fontKey,inspectFontRequirements,preflightParsedDrawing} from '../src/font-preflight.mjs'
const style=(name,font,bigFont='',handle='10')=>({name,font,bigFont,handle})
const model=(styles,entities,blocks=[],dims=[])=>({tables:{STYLE:{entries:styles},BLOCK_RECORD:{entries:blocks},DIMSTYLE:{entries:dims}},entities})
test('font filenames dedupe paths/extensions/case, never use style names as fonts',()=>{
 const r=inspectFontRequirements(model([style('XREF$0$STYLE_2','C:\\acad\\SIMPLEX.SHX'),style('DIM','simplex','chineset.shx')],[{type:'TEXT',styleName:'XREF$0$STYLE_2'},{type:'MTEXT',styleName:'DIM'}]))
 assert.deepEqual(r.requirements.map(f=>f.key),['simplex','chineset']);assert.equal(r.requirements[0].styles.length,2)
 assert.equal(fontKey('C:/fonts/SIMPLEX.shx'),'simplex')
})
test('unused table entries do not block; blank style stays unresolved rather than a fake font',()=>{
 const r=inspectFontRequirements(model([style('UNUSED','not-needed'),style('EMPTY','')],[{type:'TEXT',styleName:'EMPTY'}]))
 assert.equal(r.requirements.length,0);assert.deepEqual(r.unresolved,['EMPTY'])
})
test('block text and nested INSERT attributes are inspected, duplicate handles count once',()=>{
 const text={type:'TEXT',handle:'20',styleName:'STANDARD'}
 const r=inspectFontRequirements(model([style('STANDARD','txt')],[text],[{entities:[text,{type:'INSERT',handle:'21',attribs:[{type:'ATTRIB',handle:'22',styleName:'STANDARD'}]}]}]))
 assert.equal(r.entityCount,3);assert.equal(r.requirements[0].key,'txt')
})
test('DIMTXSTY numeric handle resolves to actual primary and big font',()=>{
 const r=inspectFontRequirements(model([style('DIMTEXT','romans','chineset','28D')],[{type:'DIMENSION',styleName:'DIM'}],[],[{name:'DIM',DIMTXSTY:653}]))
 assert.deepEqual(r.requirements.map(f=>f.key),['romans','chineset'])
})
test('missing fonts preserve parsed drawing for geometry preview; diagnostics remain available for PDF gate',async()=>{
 const parsed={model:model([style('STANDARD','simplex')],[{type:'TEXT'}]),data:{unknownEntityCount:0}};let report
 const result=await preflightParsedDrawing(parsed,async()=>{},()=>false,(r,m)=>report={r,m})
 assert.equal(result,parsed);assert.equal(report.m.length,1)
 assert.equal(await preflightParsedDrawing(parsed,async names=>assert.deepEqual(names,['simplex']),()=>true,()=>{}),parsed)
})
