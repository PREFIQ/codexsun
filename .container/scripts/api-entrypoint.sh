#!/usr/bin/env sh
set -eu

case "${CODEXSUN_RUNTIME:-}" in
  platform-api) exec node dist/apps/platform/api/server.js ;;
  core-api) exec node dist/apps/core/api/server.js ;;
  billing-api) exec node dist/apps/billing/api/server.js ;;
  *) echo "Unknown CODEXSUN_RUNTIME: ${CODEXSUN_RUNTIME:-missing}" >&2; exit 64 ;;
esac
