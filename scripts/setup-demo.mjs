import { randomBytes } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'

const directory = new URL('../runtime/', import.meta.url)
const destination = new URL('.env', directory)
const randomPassword = () => randomBytes(24).toString('base64url')

mkdirSync(directory, { recursive: true, mode: 0o700 })
try {
  writeFileSync(destination, [
    `ALTIORIS_PASSWORD_A=${randomPassword()}`,
    `ALTIORIS_PASSWORD_B=${randomPassword()}`,
    '',
  ].join('\n'), { encoding: 'utf8', flag: 'wx', mode: 0o600 })
  console.log('Created runtime/.env. Open it privately for the vetrova and zolotov demo passwords.')
} catch (error) {
  if (error.code !== 'EEXIST') throw error
  console.log('runtime/.env is already present.')
}

