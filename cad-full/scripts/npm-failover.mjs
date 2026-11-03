#!/usr/bin/env node
// Registry failover for ConvertX CAD build. Node.js >= 20.
import { spawn } from 'node:child_process'
const registries = [
  'https://registry.npmjs.org/',
  'https://registry.yarnpkg.com/',
  'https://registry.npmmirror.com/',
  'https://repo.huaweicloud.com/repository/npm/'
]
const timeoutMs = 45000
function run(args, registry) {
  return new Promise(resolve => {
    const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, {
      stdio: 'inherit',
      env: { ...process.env, npm_config_registry: registry, npm_config_fetch_retries: '1', npm_config_fetch_timeout: '15000', npm_config_replace_registry_host: 'npmjs' }
    })
    let settled = false
    const timer = setTimeout(() => { child.kill(); finish(false) }, timeoutMs)
    function finish(ok) { if (settled) return; settled = true; clearTimeout(timer); resolve(ok) }
    child.on('error', () => finish(false))
    child.on('exit', code => finish(code === 0))
  })
}
const mode = process.argv.includes('--check') ? 'check' : 'install'
let success = false
for (const registry of registries) {
  console.log('Registry candidate:', registry)
  if (!await run(['ping', '--registry', registry], registry)) continue
  if (mode === 'check') { success = true; break }
  const args = process.argv.includes('--ci') ? ['ci'] : ['install']
  if (await run([...args, '--registry', registry, '--no-audit', '--no-fund'], registry)) {
    success = true
    console.log('Registry install succeeded:', registry)
    break
  }
}
if (!success) {
  console.error('All registries failed. Inspect DNS/proxy/TLS and package availability; no successful install is claimed.')
  process.exitCode = 1
}
