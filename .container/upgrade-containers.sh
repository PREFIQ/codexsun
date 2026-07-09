#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/scripts/common.sh"

run_preflight
profiles=$(profiles_args)

cd "$PROJECT_ROOT"
npm run dependencies:check

# shellcheck disable=SC2086
compose $profiles build
# shellcheck disable=SC2086
compose $profiles up -d --remove-orphans

if [ "${RUN_PLATFORM_MIGRATIONS:-1}" = "1" ]; then
  compose run --rm -e CODEXSUN_SERVICE=platform-migrate platform-api
  compose restart platform-api core-api billing-api accounts-api
fi

compose ps
