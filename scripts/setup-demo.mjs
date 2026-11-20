import { accounts } from '../server/fixtures.mjs'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { demoAccountsFile, readDemoPasswords } from '../server/demo-accounts.mjs'

const argumentsList = process.argv.slice(2)
if (argumentsList.some((value) => value !== '--init') || argumentsList.length > 1) {
  console.error('Usage: npm run demo:setup [-- --init]')
  process.exit(2)
}
if (argumentsList.includes('--init') && !existsSync(demoAccountsFile)) {
  mkdirSync(new URL('../runtime/', import.meta.url), { recursive: true })
  writeFileSync(demoAccountsFile, JSON.stringify(accounts.map(({ login }) => ({ login, password: '' })), null, 2) + '\n', { flag: 'wx', mode: 0o600 })
  console.log('Created runtime/demo-accounts.json. Set 13 different permanent passwords (12–128 characters), then run npm run demo:setup.')
} else {
  try {
    readDemoPasswords()
    const records = JSON.parse(readFileSync(demoAccountsFile, 'utf8').replace(/^\uFEFF/u, ''))
    writeFileSync(new URL('ACCOUNTS.txt', demoAccountsFile), records.map(({ login, password }) => `${login}\t${password}`).join('\n') + '\n', { mode: 0o600 })
    console.log(`Validated ${accounts.length} fixed demo accounts. See runtime/ACCOUNTS.txt. Passwords were not changed.`)
  } catch (error) {
    console.error(existsSync(demoAccountsFile) ? error.message : 'Run npm run demo:init, fill runtime/demo-accounts.json, then run npm run demo:setup.')
    process.exitCode = 1
  }
}
