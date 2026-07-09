#!/usr/bin/env sh
set -eu

service="${CODEXSUN_SERVICE:-${1:-}}"

if [ -z "$service" ]; then
  echo "CODEXSUN_SERVICE is required."
  exit 64
fi

run_web() {
  app_dir="$1"
  port="$2"
  cd "$app_dir"
  exec npx vite preview --host 0.0.0.0 --port "$port" --strictPort
}

case "$service" in
  platform-api)
    exec node dist/apps/platform/api/server.js
    ;;
  platform-web)
    run_web apps/platform/web "${PLATFORM_WEB_PORT:-7020}"
    ;;
  core-api)
    exec node dist/apps/core/api/server.js
    ;;
  core-web)
    run_web apps/core/web "${CORE_WEB_PORT:-7040}"
    ;;
  billing-api)
    exec node dist/apps/billing/api/server.js
    ;;
  billing-web)
    run_web apps/billing/web "${BILLING_WEB_PORT:-7060}"
    ;;
  accounts-api)
    exec node dist/apps/accounts/api/server.js
    ;;
  accounts-web)
    run_web apps/accounts/web "${ACCOUNTS_WEB_PORT:-7080}"
    ;;
  platform-migrate)
    exec npm run db:migrations:run -w @codexsun/platform-api
    ;;
  platform-seed)
    exec npm run db:seed -w @codexsun/platform-api
    ;;
  shell)
    exec sh
    ;;
  *)
    echo "Unknown CODEXSUN_SERVICE: $service"
    exit 64
    ;;
esac
