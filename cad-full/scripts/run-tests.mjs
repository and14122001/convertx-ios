import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
const tests = readdirSync('tests').filter(name => name.endsWith('.test.mjs')).sort()
if (!tests.length) { console.error('No tests found'); process.exit(1) }
let failed = false
for (const file of tests) {
  console.log('\n=== '+file+' ===')
  const result = spawnSync(process.execPath, [join('tests',file)], { stdio:'inherit' })
  if (result.error || result.status !== 0) {
    failed = true
    console.error('FAIL',file,result.error?.message || 'exit '+result.status)
  }
}
if (failed) process.exitCode = 1
else console.log('PASS: all '+tests.length+' test files completed')
