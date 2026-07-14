#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/scripts/common.sh"

run_preflight
compose --profile tools config --quiet
compose --profile tools build
compose up -d --remove-orphans --wait --wait-timeout 240

if [ "${RUN_PLATFORM_MIGRATIONS:-1}" = "1" ]; then
  compose --profile tools run --rm platform-migrate
  compose restart platform-api core-api billing-api kitchen-serve-api
  compose up -d --wait --wait-timeout 240
fi

compose ps
