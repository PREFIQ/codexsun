#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=.container/scripts/common.sh
. "$SCRIPT_DIR/scripts/common.sh"

prepare_deploy_env
validate_deploy_env
require_docker

http_ok() {
  url="$1"
  label="$2"
  if command -v curl >/dev/null 2>&1; then
    curl --fail --silent --show-error --max-time 15 "$url" >/dev/null
  else
    wget -q -T 15 -O /dev/null "$url"
  fi
  echo "ok $label: $url"
}

bind=$(env_value CODEXSUN_BIND_ADDRESS 127.0.0.1)

http_ok "http://${bind}:$(env_value PLATFORM_API_HOST_PORT 7010)/health" billing-platform-api
http_ok "http://${bind}:$(env_value PLATFORM_WEB_HOST_PORT 7020)/health" billing-platform-web

published_port=$(docker port codexsun-mariadb 3306/tcp)
case "$published_port" in
  *":$(env_value MARIADB_HOST_PORT 3307)") ;;
  *) echo "MariaDB is not published on the configured host port: $published_port" >&2; exit 69 ;;
esac
echo "ok MariaDB host port: $published_port"

db_password=$(env_value DB_PASSWORD "")
docker exec -e MYSQL_PWD="$db_password" codexsun-mariadb \
  mariadb --protocol=tcp -h 127.0.0.1 -P 3306 -u "$(env_value DB_USER root)" \
  --batch --skip-column-names \
  -e "SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$(env_value DB_MASTER_NAME cxsun_master_db)';" \
  | grep -qx 1
echo "ok stack master databases"

echo "CODEXSUN container smoke test passed."
