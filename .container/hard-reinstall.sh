#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/scripts/common.sh"

run_preflight
profiles=$(profiles_args)

echo "Hard reinstall will remove CODEXSUN-owned app/file/redis volumes."
echo "MariaDB volume is preserved unless WIPE_INTERNAL_DB=1 is set."
printf "Type REINSTALL to continue: "
read confirm
if [ "$confirm" != "REINSTALL" ]; then
  echo "Cancelled."
  exit 0
fi

# shellcheck disable=SC2086
compose $profiles down --remove-orphans

docker volume rm "$(env_value CODEXSUN_STORAGE_VOLUME codexsun-storage)" >/dev/null 2>&1 || true
docker volume rm "$(env_value CODEXSUN_FILES_DB_VOLUME codexsun-files-db)" >/dev/null 2>&1 || true
docker volume rm "$(env_value CODEXSUN_REDIS_VOLUME codexsun-redis)" >/dev/null 2>&1 || true

if [ "${WIPE_INTERNAL_DB:-0}" = "1" ]; then
  docker volume rm "$(env_value CODEXSUN_MARIADB_VOLUME codexsun-mariadb)" >/dev/null 2>&1 || true
fi

# shellcheck disable=SC2086
compose $profiles build --no-cache
# shellcheck disable=SC2086
compose $profiles up -d --remove-orphans
compose ps
