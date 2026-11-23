import test from 'node:test'
import assert from 'node:assert/strict'
import {inspectDecodedCadEntities,formatDecodedCadAudit} from '../src/cad-entity-audit.mjs'
test('inventory counts model, block definition and nested attributes without double counting',()=>{
 const attr={type:'ATTRIB',handle:'a1'}
 const insert={type:'INSERT',handle:'1',attribs:[attr]}
 const model={entities:[insert,{type:'TEXT'}],tables:{BLOCK_RECORD:{entries:[{name:'Door',entities:[{type:'HATCH'},{type:'DIMENSION'},attr]}]}}}
 const audit=inspectDecodedCadEntities(model)
 assert.equal(audit.modelSpaceCount,2)
 assert.equal(audit.attributeCount,1)
 assert.equal(audit.blockDefinitionCount,2)
 assert.equal(audit.totalUniqueEntities,5)
 assert.equal(audit.counts.INSERT,1)
 assert.equal(audit.counts.ATTRIB,1)
 assert.equal(audit.counts.HATCH,1)
 assert.ok(audit.presentCritical.includes('DIMENSION'))
 assert.match(formatDecodedCadAudit(audit),/模型 2、圖塊定義 2、屬性 1/)
})
test('unknown and external entities raise explicit warnings, not false completeness',()=>{
 const audit=inspectDecodedCadEntities({entities:[{type:''},{type:'ACAD_PROXY_ENTITY'},{type:'IMAGE'}]})
 assert.equal(audit.counts.UNKNOWN,1)
 assert.ok(audit.warnings.some(w=>w.includes('未識別')))
 assert.ok(audit.warnings.some(w=>w.includes('代理圖元')))
 assert.ok(audit.warnings.some(w=>w.includes('外部影像')))
 assert.match(audit.scope,/not a rendered PDF audit/)
})
test('missing model does not invent drawing contents',()=>{
 const audit=inspectDecodedCadEntities(null)
 assert.equal(audit.totalUniqueEntities,0)
 assert.equal(audit.modelSpaceCount,0)
 assert.match(formatDecodedCadAudit(audit),/無可列舉圖元/)
})

test('missing decoded sections are unknown rather than certified empty',()=>{
 const audit=inspectDecodedCadEntities(null)
 assert.equal(audit.modelAvailable,false)
 assert.equal(audit.blockRecordsAvailable,false)
 assert.match(formatDecodedCadAudit(audit),/模型 未知、圖塊定義 未知/)
 assert.ok(audit.warnings.some(w=>w.includes('模型空間圖元清單未提供')))
 assert.ok(audit.warnings.some(w=>w.includes('圖塊定義表未提供')))
})
test('explicitly empty model and blocks remain distinguishable from missing data',()=>{
 const audit=inspectDecodedCadEntities({entities:[],tables:{BLOCK_RECORD:{entries:[]}}})
 assert.equal(audit.modelAvailable,true)
 assert.equal(audit.blockRecordsAvailable,true)
 assert.equal(audit.modelSpaceCount,0)
 assert.equal(audit.blockRecordCount,0)
 assert.match(formatDecodedCadAudit(audit),/模型 0、圖塊定義 0/)
})
test('uninspectable blocks and critical geometry produce conservative warnings',()=>{
 const audit=inspectDecodedCadEntities({entities:[{type:'INSERT'},{type:'DIMENSION'},{type:'HATCH'}],tables:{BLOCK_RECORD:{entries:[{name:'MissingGeometry'},{name:'Empty',entities:[]}]}}})
 assert.equal(audit.uninspectableBlockCount,1)
 assert.equal(audit.blockRecordCount,2)
 assert.ok(audit.warnings.some(w=>w.includes('不得視為空圖塊')))
 assert.ok(audit.warnings.some(w=>w.includes('巢狀展開')))
 assert.ok(audit.warnings.some(w=>w.includes('逐圖核對 PDF')))
})

test('INSERT names resolve case-insensitively against decoded block records',()=>{
 const model={entities:[{type:'INSERT',name:'door'},{type:'INSERT',name:'WINDOW'},{type:'INSERT',name:'Window'}],tables:{BLOCK_RECORD:{entries:[{name:'DOOR',entities:[]}]}}}
 const audit=inspectDecodedCadEntities(model)
 assert.equal(audit.insertReferenceAudit.available,true)
 assert.deepEqual(audit.insertReferenceAudit.unresolvedNames,['WINDOW'])
 assert.equal(audit.insertReferenceAudit.unnamedCount,0)
 assert.ok(audit.warnings.some(w=>w.includes('可能為 XREF')))
})
test('missing block table cannot be interpreted as broken INSERT references',()=>{
 const audit=inspectDecodedCadEntities({entities:[{type:'INSERT',name:'A'},{type:'INSERT'}]})
 assert.equal(audit.insertReferenceAudit.available,false)
 assert.deepEqual(audit.insertReferenceAudit.unresolvedNames,[])
 assert.equal(audit.insertReferenceAudit.unnamedCount,1)
 assert.ok(audit.warnings.some(w=>w.includes('無法核對定義')))
})
