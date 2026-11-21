#!/usr/bin/env bash
set -euo pipefail
umask 077

app=/srv/altioris
data=/var/lib/altioris-campus
database=$data/altioris.sqlite
credentials=$data/demo-accounts.json
node=/opt/altioris-node/bin/node
unit=/etc/systemd/system/altioris.service
old_setting="Environment=ALTIORIS_ACCOUNTS_FILE=$credentials"
new_setting=Environment=ALTIORIS_AUTH_SOURCE=sqlite

[[ $EUID -eq 0 && -x $node && -f $database && -f $unit ]]
cd -- "$(dirname -- "$0")"
exec 9>/run/lock/altioris-auth-update.lock
flock -n 9 || { printf 'Another authentication update is running.\n' >&2; exit 1; }
origin=$(sed -n 's/^Environment=ALTIORIS_ORIGIN=//p' "$unit")
[[ $origin =~ ^https://[A-Za-z0-9.-]+$ ]]
host=${origin#https://}
port=$(sed -n 's/^Environment=PORT=//p' "$unit")
[[ $port =~ ^[0-9]{1,5}$ ]]

check_site() {
  systemctl is-active --quiet altioris.service
  curl -fsS --max-time 5 --retry 4 --retry-delay 1 --retry-connrefused \
    --resolve "$host:443:127.0.0.1" "$origin/login" >/dev/null
}

verify_logins() {
  "$node" --input-type=module - "$app" "$credentials" "$origin" "$port" <<'NODE'
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'

const [app, credentials, origin, port] = process.argv.slice(2)
const { accounts } = await import(pathToFileURL(app + '/server/fixtures.mjs'))
const { readDemoPasswords } = await import(pathToFileURL(app + '/server/demo-accounts.mjs'))
const passwords = readDemoPasswords(credentials)
const base = 'http://127.0.0.1:' + port
const profiles = []
for (const { id, login } of accounts.slice(0, 2)) {
  const response = await fetch(base + '/api/login', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password: passwords[id] }),
    signal: AbortSignal.timeout(5000),
  })
  assert.equal(response.status, 200, 'Login failed after restart.')
  const cookie = response.headers.get('set-cookie') ?? ''
  assert.match(cookie, /^__Host-altioris_session=.*; Secure$/)
  const headers = { Origin: origin, Cookie: cookie.split(';')[0] }
  try {
    const account = await fetch(base + '/api/me', { headers, signal: AbortSignal.timeout(5000) })
    assert.equal(account.status, 200, 'Authenticated profile failed after restart.')
    profiles.push((await account.json()).student.shortName)
  } finally {
    await fetch(base + '/api/logout', { method: 'POST', headers, signal: AbortSignal.timeout(5000) })
  }
}
assert.ok(profiles.every(Boolean) && new Set(profiles).size === profiles.length)
console.log('Two independent logins and HTTPS verified.')
NODE
}

remove_plaintext_files() {
  local old_stage
  for old_stage in /root/altioris-transfer-*; do
    if [[ -d $old_stage && ! -L $old_stage ]]; then
      rm -f -- "$old_stage/demo-accounts.json"
    fi
  done
  rm -f -- "$credentials"
}

if grep -Fxq "$new_setting" "$unit" && ! grep -Fq 'ALTIORIS_ACCOUNTS_FILE=' "$unit" &&
    cmp -s index.mjs "$app/server/index.mjs" && cmp -s store.mjs "$app/server/store.mjs"; then
  check_site
  if [[ -e $credentials ]]; then verify_logins; fi
  remove_plaintext_files
  printf 'Altioris already uses database hashes. HTTPS: %s\n' "$origin"
  exit 0
fi

[[ -s $credentials ]] || { printf 'The previous private credential file is unavailable for verification.\n' >&2; exit 1; }
[[ $(grep -Fxc "$old_setting" "$unit") = 1 ]]
grep -Fxq "Environment=ALTIORIS_DB=$database" "$unit"
"$node" --check index.mjs
"$node" --check store.mjs

backup_dir=$(mktemp -d /root/altioris-auth-backup.XXXXXXXX)
cp -- "$app/server/index.mjs" "$app/server/store.mjs" "$unit" "$backup_dir/"
"$node" --input-type=module - "$app" "$database" "$credentials" "$backup_dir/altioris.sqlite" <<'NODE'
import assert from 'node:assert/strict'
import { scryptSync, timingSafeEqual } from 'node:crypto'
import { DatabaseSync, backup } from 'node:sqlite'
import { pathToFileURL } from 'node:url'

const [app, database, credentials, snapshot] = process.argv.slice(2)
const { accounts } = await import(pathToFileURL(app + '/server/fixtures.mjs'))
const { readDemoPasswords } = await import(pathToFileURL(app + '/server/demo-accounts.mjs'))
const passwords = readDemoPasswords(credentials)
const db = new DatabaseSync(database, { readOnly: true })
try {
  const hashes = db.prepare('SELECT salt, password_hash FROM accounts WHERE id = ? AND login = ?')
  for (const { id, login } of accounts) {
    const row = hashes.get(id, login)
    assert.ok(row && timingSafeEqual(scryptSync(passwords[id], row.salt, 64), row.password_hash),
      'A configured login does not match its saved hash.')
  }
  await backup(db, snapshot)
} finally {
  db.close()
}
const copy = new DatabaseSync(snapshot, { readOnly: true })
try {
  assert.equal(copy.prepare('PRAGMA quick_check').get().quick_check, 'ok')
} finally {
  copy.close()
}
console.log('All saved passwords match their hashes. SQLite backup verified.')
NODE

rollback=1
restore_if_failed() {
  local status=$?
  if (( status != 0 && rollback )); then
    set +e
    printf 'Verification failed. Restoring the previous service configuration.\n' >&2
    install -m 0644 "$backup_dir/index.mjs" "$backup_dir/store.mjs" "$app/server/"
    install -m 0644 "$backup_dir/altioris.service" "$unit"
    systemctl daemon-reload
    systemctl restart altioris.service
  fi
}
trap restore_if_failed EXIT

sed "s|^$old_setting\$|$new_setting|" "$unit" > altioris.service
grep -Fxq "$new_setting" altioris.service
! grep -Fq 'ALTIORIS_ACCOUNTS_FILE=' altioris.service
install -m 0644 index.mjs store.mjs "$app/server/"
install -m 0644 altioris.service "$unit"
rm -f -- altioris.service
systemctl daemon-reload
systemctl restart altioris.service
check_site

verify_logins

rollback=0
remove_plaintext_files
printf 'Altioris now uses SQLite hashes. Plaintext credential file removed.\n'
printf 'HTTPS: %s\nPrivate backup: %s\n' "$origin" "$backup_dir"
