#!/usr/bin/env sh
set -eu

source_dir="/opt/codexsun-web/${CODEXSUN_WEB_APP:-}"
[ -d "$source_dir" ] || {
  echo "Unknown CODEXSUN_WEB_APP: ${CODEXSUN_WEB_APP:-missing}" >&2
  exit 64
}

rm -rf /usr/share/nginx/html/*
cp -a "$source_dir/." /usr/share/nginx/html/
exec nginx -g 'daemon off;'
