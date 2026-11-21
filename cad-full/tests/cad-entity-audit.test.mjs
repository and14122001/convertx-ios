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
