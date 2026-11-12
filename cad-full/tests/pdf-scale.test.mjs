import assert from 'node:assert/strict'
import { test } from 'node:test'
import { makeScaleFitBox, unitCodeForChoice } from '../src/pdf-scale.mjs'

const extents = { min: { x: 0, y: 0 }, max: { x: 100, y: 50 } }
const page = { widthMm: 297, heightMm: 210 }

test('explicit drawing units map to fixed renderer INSUNITS values', () => {
  assert.deepEqual(['mm', 'cm', 'm', 'inch', 'foot'].map(unitCodeForChoice), [4, 5, 6, 1, 2])
  assert.throws(() => unitCodeForChoice('unknown'), /明確選擇/)
})

test('1:50 fit box is centered and sized for exact chosen scale', () => {
  const result = makeScaleFitBox(extents, { unit: 'mm', denominator: 50, ...page })
  assert.equal(result.unitCode, 4)
  assert.ok(Math.abs(result.pointsPerDrawingUnit - (72 / 25.4 / 50)) < 1e-12)
  assert.ok(Math.abs((result.fitBox.min.x + result.fitBox.max.x) / 2 - 50) < 1e-9)
  assert.ok(result.fitBox.max.x - result.fitBox.min.x >= extents.max.x - extents.min.x)
})

test('rejects a scale that would clip drawing extents', () => {
  assert.throws(() => makeScaleFitBox(extents, { unit: 'mm', denominator: 1, widthMm: 40, heightMm: 40 }), /無法以 1:1 放入/)
})

test('rejects invalid or missing extents and scale inputs', () => {
  assert.throws(() => makeScaleFitBox(undefined, { unit: 'mm', denominator: 50, ...page }), /範圍無效/)
  assert.throws(() => makeScaleFitBox(extents, { unit: 'unknown', denominator: 50, ...page }), /明確選擇/)
  assert.throws(() => makeScaleFitBox(extents, { unit: 'mm', denominator: 0, ...page }), /分母/)
})
