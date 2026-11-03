import assert from 'node:assert/strict'
import {test} from 'node:test'
import {validateCadFile} from '../src/file-validation.ts'
const bytes=s=>new TextEncoder().encode(s).buffer
test('DWG AC1032 accepted',()=>assert.equal(validateCadFile('plan.dwg',bytes('AC1032data')),'DWG'))
test('DWG incorrect magic rejected',()=>assert.throws(()=>validateCadFile('plan.dwg',bytes('not-dwg')),/標頭/))
test('DWG truncated rejected',()=>assert.throws(()=>validateCadFile('plan.dwg',bytes('AC10')),/不完整/))
test('ASCII DXF accepted',()=>assert.equal(validateCadFile('plan.dxf',bytes('0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nEOF\n')),'DXF'))
test('Binary DXF accepted',()=>assert.equal(validateCadFile('plan.dxf',bytes('AutoCAD Binary DXF\r\n')),'DXF'))
test('empty rejected',()=>assert.throws(()=>validateCadFile('plan.dwg',bytes('')),/空/))
test('unknown extension rejected',()=>assert.throws(()=>validateCadFile('plan.pdf',bytes('hello')),/僅支援/))
