#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/scripts/common.sh"

run_preflight
set_env_value CODEXSUN_ADMIN_TOOLS 1
compose --profile admin up -d docker-admin mariadb-admin redis-admin
compose ps docker-admin mariadb-admin redis-admin
