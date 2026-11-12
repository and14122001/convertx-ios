import { test } from 'node:test'
import assert from 'node:assert/strict'
import { inflateSync } from 'node:zlib'
import { AcDbDatabase, AcDbLine } from '@mlightcad/data-model'
import { exportDatabaseToPdf } from '@mlightcad/pdf-renderer'
import { inspectPdfBytes } from '../src/pdf-audit.mjs'

function pageObjects(bytes) {
  const pdf = Buffer.from(bytes).toString('latin1')
  const match = pdf.match(/\/Type \/ObjStm[\s\S]*?stream\r?\n([\s\S]*?)\r?\nendstream/)
  assert.ok(match, 'PDF must contain a compressed object stream')
  return inflateSync(Buffer.from(match[1], 'latin1')).toString('latin1')
}

test('renderer produces a real vector PDF with requested A4 portrait page', async () => {
  const db = new AcDbDatabase()
  db.tables.blockTable.modelSpace.appendEntity(new AcDbLine(
    { x: 0, y: 0, z: 0 }, { x: 100, y: 100, z: 0 }
  ))
  const bytes = await exportDatabaseToPdf(db, {
    paper: { widthMm: 210, heightMm: 297 }, title: 'A4 vector smoke'
  })
  assert.equal(inspectPdfBytes(bytes).version, '1.7')
  const pdf = Buffer.from(bytes).toString('latin1')
  assert.match(pdf, /0 0 m\s*100 100 l\s*S/, 'PDF stream must contain the vector line')
  assert.match(pageObjects(bytes), /MediaBox \[ 0 0 595\.2755905511812 841\.8897637795277 \]/)
})

test('renderer produces the requested A3 landscape page size', async () => {
  const db = new AcDbDatabase()
  db.tables.blockTable.modelSpace.appendEntity(new AcDbLine(
    { x: 0, y: 0, z: 0 }, { x: 100, y: 100, z: 0 }
  ))
  const bytes = await exportDatabaseToPdf(db, {
    paper: { widthMm: 420, heightMm: 297 }, title: 'A3 landscape smoke'
  })
  const objects = pageObjects(bytes)
  assert.match(objects, /MediaBox \[ 0 0 1190\.5511811023623 841\.8897637795277 \]/)
})
