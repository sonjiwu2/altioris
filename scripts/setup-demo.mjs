import { accounts } from '../server/fixtures.mjs'
import { readDemoPasswords } from '../server/demo-accounts.mjs'

readDemoPasswords()
console.log(`Validated ${accounts.length} fixed demo accounts. See runtime/ACCOUNTS.txt.`)
