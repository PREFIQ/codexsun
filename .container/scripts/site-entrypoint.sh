#!/usr/bin/env sh
set -eu

case "${CODEXSUN_SITE_CLIENT:-}" in
  codexsun|logicx|techmedia) ;;
  *) echo "Unknown CODEXSUN_SITE_CLIENT: ${CODEXSUN_SITE_CLIENT:-missing}" >&2; exit 64 ;;
esac

source_dir="/opt/codexsun-sites/${CODEXSUN_SITE_CLIENT}"
rm -rf /usr/share/nginx/html/*
cp -a "$source_dir/." /usr/share/nginx/html/
exec nginx -g 'daemon off;'
