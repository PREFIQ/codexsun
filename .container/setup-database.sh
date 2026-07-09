#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/scripts/common.sh"

run_preflight
mode="${1:-status}"

case "$mode" in
  internal)
    set_env_value CODEXSUN_DB_MODE internal
    set_env_value DB_HOST mariadb
    compose --profile internal-db up -d mariadb
    ;;
  external)
    set_env_value CODEXSUN_DB_MODE external
    set_env_value DB_HOST "${DB_HOST:-$(env_value DB_HOST 127.0.0.1)}"
    set_env_value DB_PORT "${DB_PORT:-$(env_value DB_PORT 3306)}"
    echo "External MariaDB selected: $(env_value DB_HOST):$(env_value DB_PORT)"
    ;;
  status)
    compose ps mariadb || true
    ;;
  *)
    echo "Usage: .container/setup-database.sh [internal|external|status]"
    exit 64
    ;;
esac
