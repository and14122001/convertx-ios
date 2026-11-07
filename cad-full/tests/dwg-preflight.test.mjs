import assert from 'node:assert/strict'
import {test} from 'node:test'
import {inspectDwgHeader,parseUnitChoice} from '../src/dwg-preflight.mjs'
const b=s=>new TextEncoder().encode(s)
test('known DWG version without inventing units',()=>{
 const r=inspectDwgHeader(b('AC1032rest'))
 assert.equal(r.version,'2018')
 assert.match(r.warnings.join(' '),/INSUNITS/)
})
test('unknown DWG version stays unknown',()=>{
 const r=inspectDwgHeader(b('AC1099rest'))
 assert.equal(r.version,null)
 assert.match(r.warnings.join(' '),/版本未列入/)
})
test('truncated and malformed DWG rejected',()=>{
 assert.throws(()=>inspectDwgHeader(b('AC10')),/不完整/)
 assert.throws(()=>inspectDwgHeader(b('NOTDWG')),/無效/)
})
test('unknown units cannot claim measurable PDF',()=>assert.match(parseUnitChoice('unknown').warning,/禁止/))
test('user-selected units do not claim verified scale',()=>assert.match(parseUnitChoice('mm').warning,/尚未核對/))
test('invalid unit rejected',()=>assert.throws(()=>parseUnitChoice('pixels'),/無效/))
