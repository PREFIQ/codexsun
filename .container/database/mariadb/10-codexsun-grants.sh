#!/usr/bin/env bash
set -euo pipefail

# CODEXSUN provisions one database per tenant. The deployment app user needs
# dynamic database lifecycle privileges and remains isolated inside this server.
docker_process_sql <<SQL
GRANT ALL PRIVILEGES ON *.* TO '${MARIADB_USER}'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
SQL
