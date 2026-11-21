#!/usr/bin/env bash
set -euo pipefail
umask 077

public=/srv/altioris/public
unit=/etc/systemd/system/altioris.service
assets=(features/phone-ui.js phone.css app.js index.html)
[[ $EUID -eq 0 && -d $public && -f $unit ]]
cd -- "$(dirname -- "$0")"
exec 9>/run/lock/altioris-ui-update.lock
flock -n 9 || { printf 'Another interface update is running.\n' >&2; exit 1; }
origin=$(sed -n 's/^Environment=ALTIORIS_ORIGIN=//p' "$unit")
[[ $origin =~ ^https://[A-Za-z0-9.-]+$ ]]
host=${origin#https://}
backup=$(mktemp -d /root/altioris-ui-backup.XXXXXXXX)

for asset in "${assets[@]}"; do
  name=${asset##*/}
  [[ -s $name && -f $public/$asset ]]
  cp -- "$public/$asset" "$backup/$name"
done

publish() {
  local input=$1 destination=$2 staged
  staged=$(mktemp "$(dirname -- "$destination")/.altioris-ui.XXXXXXXX")
  install -m 0644 -- "$input" "$staged"
  mv -fT -- "$staged" "$destination"
}

restore_on_failure() {
  local status=$? asset
  if (( status != 0 )); then
    printf 'HTTPS verification failed. Restoring previous assets.\n' >&2
    for asset in "${assets[@]}"; do
      publish "$backup/${asset##*/}" "$public/$asset"
    done
  fi
}
trap restore_on_failure EXIT

for asset in "${assets[@]}"; do
  publish "${asset##*/}" "$public/$asset"
done
for asset in "${assets[@]}"; do
  read -r expected _ < <(sha256sum -- "${asset##*/}")
  read -r actual _ < <(curl -fsS --max-time 7 --resolve "$host:443:127.0.0.1" "$origin/$asset" | sha256sum)
  [[ $actual == "$expected" ]]
done

trap - EXIT
printf 'Interface updated and verified over HTTPS.\n%s\nPrivate backup: %s\n' "$origin" "$backup"
