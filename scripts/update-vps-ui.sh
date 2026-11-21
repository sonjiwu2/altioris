#!/usr/bin/env bash
set -euo pipefail
umask 077

app=/srv/altioris
unit=/etc/systemd/system/altioris.service
mode=${1:-interface}
assets=(features/phone-ui.js phone.css typography.css)
backend=()
[[ $EUID -eq 0 && -d $app/public && -f $unit ]]
cd -- "$(dirname -- "$0")"
exec 9>/run/lock/altioris-ui-update.lock
flock -n 9 || { printf 'Another interface update is running.\n' >&2; exit 1; }
origin=$(sed -n 's/^Environment=ALTIORIS_ORIGIN=//p' "$unit")
[[ $origin =~ ^https://[A-Za-z0-9.-]+$ ]]
host=${origin#https://}
if [[ $mode == support ]]; then
  assets+=(features/support-view.js features/services.js)
  backend=(server/support-assistant.mjs server/support-faq.mjs)
  for file in "${backend[@]}"; do
    /opt/altioris-node/bin/node --check "${file##*/}"
  done
else
  [[ $mode == interface ]]
fi
assets+=(app.js index.html)
files=("${backend[@]}")
for asset in "${assets[@]}"; do files+=("public/$asset"); done
backup=$(mktemp -d /root/altioris-ui-backup.XXXXXXXX)

for file in "${files[@]}"; do
  name=${file##*/}
  [[ -s $name && -f $app/$file ]]
  cp -- "$app/$file" "$backup/$name"
done

publish() {
  local input=$1 destination=$2 staged
  staged=$(mktemp "$(dirname -- "$destination")/.altioris-ui.XXXXXXXX")
  install -m 0644 -- "$input" "$staged"
  mv -fT -- "$staged" "$destination"
}

restore_on_failure() {
  local status=$? file
  if (( status != 0 )); then
    printf 'HTTPS verification failed. Restoring previous files.\n' >&2
    for file in "${files[@]}"; do
      publish "$backup/${file##*/}" "$app/$file"
    done
    if [[ $mode == support ]]; then systemctl restart altioris.service; fi
  fi
}
trap restore_on_failure EXIT

for file in "${files[@]}"; do
  publish "${file##*/}" "$app/$file"
done
if [[ $mode == support ]]; then
  systemctl restart altioris.service
  curl -fsS --max-time 7 --retry 5 --retry-connrefused --retry-delay 1 \
    --resolve "$host:443:127.0.0.1" "$origin/login" >/dev/null
  systemctl is-active --quiet altioris.service
fi
for asset in "${assets[@]}"; do
  read -r expected _ < <(sha256sum -- "${asset##*/}")
  read -r actual _ < <(curl -fsS --max-time 7 --resolve "$host:443:127.0.0.1" "$origin/$asset" | sha256sum)
  [[ $actual == "$expected" ]]
done

trap - EXIT
printf 'Interface updated and verified over HTTPS.\n%s\nPrivate backup: %s\n' "$origin" "$backup"
