#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/scripts/common.sh"

ask() {
  prompt="$1"
  default="$2"
  printf "%s [%s]: " "$prompt" "$default"
  read answer || answer=""
  printf "%s" "${answer:-$default}"
}

run_preflight

mode=$(ask "Deploy method: upgrade or reinstall" "upgrade")
db_mode=$(ask "MariaDB mode: internal or external" "$(env_value CODEXSUN_DB_MODE internal)")
redis_mode=$(ask "Redis mode: internal or external" "$(env_value CODEXSUN_REDIS_MODE internal)")

set_env_value CODEXSUN_DB_MODE "$db_mode"
set_env_value CODEXSUN_REDIS_MODE "$redis_mode"

if [ "$db_mode" = "external" ]; then
  set_env_value DB_HOST "$(ask "External MariaDB host" "$(env_value DB_HOST 127.0.0.1)")"
  set_env_value DB_PORT "$(ask "External MariaDB port" "$(env_value DB_PORT 3306)")"
fi

if [ "$redis_mode" = "external" ]; then
  set_env_value CODEXSUN_REDIS_URL "$(ask "External Redis URL" "$(env_value CODEXSUN_REDIS_URL redis://127.0.0.1:6379)")"
fi

case "$mode" in
  upgrade)
    exec "$SCRIPT_DIR/upgrade-containers.sh"
    ;;
  reinstall|hard-reinstall)
    exec "$SCRIPT_DIR/hard-reinstall.sh"
    ;;
  *)
    echo "Unknown method: $mode"
    exit 64
    ;;
esac
