import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const matrix=JSON.parse(readFileSync(new URL('./cad-fidelity-cases.json',import.meta.url),'utf8'))
test('DWG to PDF acceptance matrix requires two real DWG references',()=>{
 assert.equal(matrix.schemaVersion,1)
 assert.ok(matrix.minimumRealDwgSamples>=2)
 assert.ok(matrix.samples.length>=matrix.minimumRealDwgSamples)
 assert.equal(new Set(matrix.samples.map(x=>x.id)).size,matrix.samples.length)
 for(const sample of matrix.samples){
  assert.ok(['awaiting-real-file','ready','verified','failed'].includes(sample.status))
  if(sample.status==='verified'){
   assert.match(sample.sha256,/^[a-f0-9]{64}$/)
   assert.match(sample.referencePdfSha256,/^[a-f0-9]{64}$/)
  }
 }
})
test('DWG fidelity gate explicitly covers critical CAD entities and offline download',()=>{
 for(const name of ['dwg-wasm-parse','layers','block-insert','text-mtext-shape','dimension','hatch','xref-font-warnings','pdf-vector-content','pdf-mediabox','iphone-safari-airplane-download']){
  assert.ok(matrix.requiredChecks.includes(name),name)
 }
})
