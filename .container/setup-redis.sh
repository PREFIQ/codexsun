#!/usr/bin/env sh
set -eu
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/scripts/common.sh"
run_preflight
stack_compose database/redis/docker-compose.yml up -d --build --wait --wait-timeout 120
stack_compose database/redis/docker-compose.yml ps
