#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/scripts/common.sh"

run_preflight
mode="${1:-status}"

case "$mode" in
  internal)
    set_env_value CODEXSUN_REDIS_MODE internal
    set_env_value CODEXSUN_REDIS_URL redis://redis:6379
    compose --profile internal-redis up -d redis
    ;;
  external)
    set_env_value CODEXSUN_REDIS_MODE external
    set_env_value CODEXSUN_REDIS_URL "${CODEXSUN_REDIS_URL:-$(env_value CODEXSUN_REDIS_URL redis://127.0.0.1:6379)}"
    echo "External Redis selected: $(env_value CODEXSUN_REDIS_URL)"
    ;;
  status)
    compose ps redis || true
    ;;
  *)
    echo "Usage: .container/setup-redis.sh [internal|external|status]"
    exit 64
    ;;
esac
