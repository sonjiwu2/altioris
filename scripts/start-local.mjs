import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createApplication, readConfig } from '../server/index.mjs'
import { demoAccountsFile } from '../server/demo-accounts.mjs'

const directory = new URL('../runtime/', import.meta.url)
const addressFile = new URL('local-server.json', directory)
let port = 3000
if (existsSync(addressFile)) {
  const prior = JSON.parse(readFileSync(addressFile, 'utf8'))
  if (Number.isInteger(prior.port) && prior.port > 0 && prior.port < 65536) port = prior.port
}

const config = readConfig({
  ...process.env,
  NODE_ENV: 'development',
  ALTIORIS_ACADEMIC_SIMULATION: process.env.ALTIORIS_ACADEMIC_SIMULATION ?? '1',
  HOST: '127.0.0.1',
  PORT: String(port),
  ALTIORIS_ORIGIN: '',
  ALTIORIS_DB: fileURLToPath(new URL('altioris.sqlite', directory)),
  ALTIORIS_ACCOUNTS_FILE: fileURLToPath(demoAccountsFile),
})
const server = createApplication(config)
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE' && port !== 0) {
    port = 0
    server.listen(port, config.host)
    return
  }
  console.error(`Altioris could not start: ${error.message}`)
  process.exit(1)
})
server.on('listening', () => {
  const selectedPort = server.address().port
  const url = `http://${config.host}:${selectedPort}`
  mkdirSync(directory, { recursive: true })
  writeFileSync(addressFile, JSON.stringify({ pid: process.pid, port: selectedPort, url }) + '\n')
  console.log(`Altioris is ready: ${url}`)
  console.log('13 fixed accounts. Credentials: runtime/ACCOUNTS.txt')
})
server.listen(port, config.host)
