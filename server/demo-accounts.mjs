import { existsSync, readFileSync } from 'node:fs'
import { accounts } from './fixtures.mjs'

export const demoAccountsFile = new URL('../runtime/demo-accounts.json', import.meta.url)

export function readDemoPasswords(file = demoAccountsFile) {
  const records = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/u, ''))
  if (!Array.isArray(records) || records.length !== accounts.length) {
    throw new Error(`Expected ${accounts.length} fixed demo accounts in runtime/demo-accounts.json.`)
  }
  const passwords = {}
  const used = new Set()
  for (const record of records) {
    const account = accounts.find(({ login }) => login === record?.login)
    const password = record?.password
    if (!account || passwords[account.id] !== undefined || typeof password !== 'string' ||
        password.length < 12 || password.length > 128 || used.has(password)) {
      throw new Error('Every login must have one independent password of 12–128 characters.')
    }
    passwords[account.id] = password
    used.add(password)
  }
  return passwords
}

export function configuredPasswords(env) {
  const file = env.ALTIORIS_ACCOUNTS_FILE ||
    (env === process.env && env.NODE_ENV !== 'production' && existsSync(demoAccountsFile) ? demoAccountsFile : null)
  const fixed = file ? readDemoPasswords(file) : {}
  const active = accounts.filter(({ id, passwordEnv }) => id === 'a' || id === 'b' ||
    fixed[id] !== undefined || env[passwordEnv] !== undefined)
  return Object.fromEntries(active.map(({ id, passwordEnv }) => [id, fixed[id] ?? env[passwordEnv]]))
}
