#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/scripts/common.sh"

run_preflight
compose --profile tools config --quiet

echo "This recreates all CODEXSUN containers and images."
echo "Volumes are preserved unless WIPE_APP_DATA, WIPE_STORAGE_DATA, WIPE_REDIS_DATA, or WIPE_INTERNAL_DB is 1."
printf "Type REINSTALL to continue: "
read confirm
[ "$confirm" = "REINSTALL" ] || { echo "Cancelled."; exit 0; }

compose --profile tools down --remove-orphans

remove_volume() {
  docker volume rm "$1" >/dev/null 2>&1 || true
}

if [ "${WIPE_APP_DATA:-0}" = "1" ]; then
  remove_volume "$(env_value PLATFORM_DATA_VOLUME codexsun-platform-data)"
  remove_volume "$(env_value CORE_DATA_VOLUME codexsun-core-data)"
  remove_volume "$(env_value BILLING_DATA_VOLUME codexsun-billing-data)"
  remove_volume "$(env_value KITCHEN_SERVE_DATA_VOLUME codexsun-kitchen-serve-data)"
fi

if [ "${WIPE_STORAGE_DATA:-0}" = "1" ]; then
  remove_volume "$(env_value PICTURES_DATA_VOLUME codexsun-pictures-data)"
  remove_volume "$(env_value PICTURES_DB_VOLUME codexsun-pictures-db)"
  remove_volume "$(env_value FILES_DATA_VOLUME codexsun-files-data)"
  remove_volume "$(env_value FILES_DB_VOLUME codexsun-files-db)"
fi

if [ "${WIPE_REDIS_DATA:-0}" = "1" ]; then
  remove_volume "$(env_value REDIS_DATA_VOLUME codexsun-redis-data)"
fi

if [ "${WIPE_INTERNAL_DB:-0}" = "1" ]; then
  remove_volume "$(env_value MARIADB_DATA_VOLUME codexsun-mariadb-data)"
fi

compose --profile tools build --no-cache
compose up -d --remove-orphans --wait --wait-timeout 240

if [ "${RUN_PLATFORM_MIGRATIONS:-1}" = "1" ]; then
  compose --profile tools run --rm platform-migrate
  compose restart platform-api core-api billing-api kitchen-serve-api
  compose up -d --wait --wait-timeout 240
fi

compose ps
