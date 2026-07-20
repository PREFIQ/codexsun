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

site_identity_ok() {
  base_url="$1"
  expected="$2"
  html=$(curl --fail --silent --show-error --max-time 15 "$base_url/")
  asset=$(printf '%s' "$html" | grep -o 'src="[^"]*\.js"' | head -n 1 | cut -d'"' -f2)
  [ -n "$asset" ] || { echo "No JavaScript entry found for $expected" >&2; exit 69; }
  bundle_file=$(mktemp)
  curl --fail --silent --show-error --max-time 30 -o "$bundle_file" "${base_url}${asset}"
  grep -Fq "$expected" "$bundle_file" || {
    rm -f "$bundle_file"
    echo "The deployed site bundle does not contain its expected identity: $expected" >&2
    exit 69
  }
  rm -f "$bundle_file"
  echo "ok site identity: $expected"
}

bind=$(env_value CODEXSUN_BIND_ADDRESS 127.0.0.1)

http_ok "http://${bind}:$(env_value PLATFORM_API_HOST_PORT 7010)/health" billing-platform-api
http_ok "http://${bind}:$(env_value PLATFORM_WEB_HOST_PORT 7020)/health" billing-platform-web
http_ok "http://${bind}:$(env_value CORE_API_HOST_PORT 7030)/health" billing-core-api
http_ok "http://${bind}:$(env_value CORE_WEB_HOST_PORT 7040)/health" billing-core-web
http_ok "http://${bind}:$(env_value BILLING_API_HOST_PORT 7050)/health" billing-api
http_ok "http://${bind}:$(env_value BILLING_WEB_HOST_PORT 7060)/health" billing-web

http_ok "http://${bind}:$(env_value ECOMMERCE_PLATFORM_API_HOST_PORT 7310)/health" ecommerce-platform-api
http_ok "http://${bind}:$(env_value ECOMMERCE_CORE_API_HOST_PORT 7330)/health" ecommerce-core-api
http_ok "http://${bind}:$(env_value ECOMMERCE_BILLING_API_HOST_PORT 7350)/health" ecommerce-billing-api
http_ok "http://${bind}:$(env_value ECOMMERCE_API_HOST_PORT 7150)/health" ecommerce-api
http_ok "http://${bind}:$(env_value ECOMMERCE_WEB_HOST_PORT 7160)/health" ecommerce-web

http_ok "http://${bind}:$(env_value B2BCONNECT_PLATFORM_API_HOST_PORT 7210)/health" b2bconnect-platform-api
http_ok "http://${bind}:$(env_value B2BCONNECT_CORE_API_HOST_PORT 7230)/health" b2bconnect-core-api
http_ok "http://${bind}:$(env_value B2BCONNECT_API_HOST_PORT 7135)/health" b2bconnect-api
http_ok "http://${bind}:$(env_value B2BCONNECT_WEB_HOST_PORT 7140)/health" b2bconnect-web

http_ok "http://${bind}:$(env_value CODEXSUN_SITE_HOST_PORT 7170)/" codexsun.com
http_ok "http://${bind}:$(env_value LOGICX_SITE_HOST_PORT 7180)/" logicx.in
http_ok "http://${bind}:$(env_value TECHMEDIA_SITE_HOST_PORT 7190)/" techmedia.in
site_identity_ok "http://${bind}:$(env_value CODEXSUN_SITE_HOST_PORT 7170)" CODEXSUN
site_identity_ok "http://${bind}:$(env_value LOGICX_SITE_HOST_PORT 7180)" Logicx
site_identity_ok "http://${bind}:$(env_value TECHMEDIA_SITE_HOST_PORT 7190)" "Tech Media"

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
  -e "SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME IN ('$(env_value DB_MASTER_NAME cxsun_master_db)','$(env_value ECOMMERCE_DB_MASTER_NAME cxsun_ecommerce_master)','$(env_value B2BCONNECT_DB_MASTER_NAME cxsun_b2bconnect_master)');" \
  | grep -qx 3
echo "ok stack master databases"

docker exec codexsun-b2bconnect-api \
  sh -lc 'test -s /app/storage/b2bconnect/b2bconnect.sqlite'
echo "ok B2B Connect persistent SQLite"

echo "CODEXSUN container smoke test passed."
