import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8')
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

test('loaded drawing reports actual layer and model-space entity counts', () => {
  assert.match(source, /圖層 \$\{layers\.length\}/)
  assert.match(source, /模型空間圖元 \$\{modelSpace\.length\}/)
  assert.match(source, /型別 \$\{Object\.entries\(types\)/)
})

test('unresolved XREF names are reported without claiming external content was loaded', () => {
  assert.match(source, /blocks\.filter\(block=>block\.isXref\)/)
  assert.match(source, /XREF \$\{xrefs\.length\?xrefs\.join\(', '\):'未核對'\}/)
})

test('UI warns that fonts, XREFs, unsupported entities and proxy objects are not fidelity checked', () => {
  assert.match(html, /SHX 或缺失字型仍可能缺字/)
  assert.match(html, /XREF 未載入或核對/)
  assert.match(html, /不支援及代理物件可能缺漏/)
  assert.match(source, /不支援／代理物件尚未完成保真核對/)
})
