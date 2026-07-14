#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/scripts/common.sh"

stack=${1:-}
action=${2:-up}

case "$stack" in
  mariadb) file=database/mariadb/docker-compose.yml ;;
  redis) file=database/redis/docker-compose.yml ;;
  storage|pictures|files) file=storage/docker-compose.yml ;;
  platform) file=platform/docker-compose.yml ;;
  core) file=core/docker-compose.yml ;;
  billing) file=billing/docker-compose.yml ;;
  kitchen-serve|kitchen) file=kitchen-serve/docker-compose.yml ;;
  *)
    echo "Usage: .container/stack.sh {mariadb|redis|storage|platform|core|billing|kitchen-serve} {up|build|pull|ps|logs|down}" >&2
    exit 64
    ;;
esac

run_preflight

case "$action" in
  up|deploy)
    stack_compose "$file" up -d --build --wait --wait-timeout 240
    stack_compose "$file" ps
    ;;
  build|pull|ps|down)
    stack_compose "$file" "$action"
    ;;
  logs)
    stack_compose "$file" logs -f --tail=150
    ;;
  *)
    echo "Unknown action: $action" >&2
    exit 64
    ;;
esac
