#!/usr/bin/env sh
set -eu

case "${CODEXSUN_RUNTIME:-}" in
  platform-api) exec node dist/apps/platform/api/server.js ;;
  core-api) exec node dist/apps/core/api/server.js ;;
  billing-api) exec node dist/apps/billing/api/server.js ;;
  ecommerce-api) exec node dist/apps/ecommerce/api/server.js ;;
  b2bconnect-api) exec node dist/apps/b2bconnect/api/server.js ;;
  *) echo "Unknown CODEXSUN_RUNTIME: ${CODEXSUN_RUNTIME:-missing}" >&2; exit 64 ;;
esac
