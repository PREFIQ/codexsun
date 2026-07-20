#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=.container/scripts/common.sh
. "$SCRIPT_DIR/scripts/common.sh"

MODE=install
TARGET=billing

usage() {
  cat <<'EOF'
Usage: .container/setup.sh [--reinstall] [billing|ecommerce|b2bconnect|sites|all]

Installs/starts MariaDB, Redis, and Media once, then deploys the selected product
stack. "all" installs all four product stacks using non-conflicting host ports.

--reinstall cleanly replaces CODEXSUN containers and images, then runs safe
forward migrations. Named volumes, databases, credentials, and uploads remain.
No setup mode deletes a Docker volume or drops a database.
EOF
}

for arg in "$@"; do
  case "$arg" in
    --reinstall) MODE=reinstall ;;
    billing|ecommerce|b2bconnect|sites|all) TARGET=$arg ;;
    -h|--help) usage; exit 0 ;;
    *) usage >&2; exit 64 ;;
  esac
done

run_preflight

infrastructure_image() {
  stack="$1"
  registry=$(env_value CODEXSUN_IMAGE_REGISTRY codexsun)
  version=$(env_value CODEXSUN_VERSION 1.0.37)
  case "$stack" in
    mariadb) tag=$(env_value MARIADB_IMAGE_TAG "11.8-codexsun-${version}") ;;
    redis) tag=$(env_value REDIS_IMAGE_TAG "7.4-codexsun-${version}") ;;
    media) tag=$(env_value MEDIA_IMAGE_TAG "${version}-filebrowser2.63.5") ;;
    *) echo "Unknown infrastructure image: $stack" >&2; exit 64 ;;
  esac
  printf '%s/%s:%s' "$registry" "$stack" "$tag"
}

remove_infrastructure_images() {
  for stack in mariadb redis media; do
    image=$(infrastructure_image "$stack")
    if docker image inspect "$image" >/dev/null 2>&1; then
      docker image rm "$image" >/dev/null || {
        echo "Failed to remove infrastructure image: $image" >&2
        exit 74
      }
      echo "Removed infrastructure image: $image"
    fi
  done
}

stop_all_containers() {
  for stack in sites b2bconnect ecommerce billing; do
    bash "$SCRIPT_DIR/deploy.sh" "$stack" down >/dev/null 2>&1 || true
  done
  stack_compose media down --remove-orphans
  stack_compose database/redis down --remove-orphans
  stack_compose database/mariadb down --remove-orphans
}

build_option=()
if [ "$MODE" = "reinstall" ]; then
  echo "Clean reinstall requested. Named volumes and databases will be preserved."
  stop_all_containers
  remove_infrastructure_images
  build_option=(--pull --no-cache)
fi

stack_compose database/mariadb build "${build_option[@]}"
stack_compose database/mariadb up -d --no-build --wait --wait-timeout 180
MSYS_NO_PATHCONV=1 docker exec codexsun-mariadb \
  bash /docker-entrypoint-initdb.d/10-codexsun-grants.sh >/dev/null
echo "MariaDB application grants reconciled. Host access: 127.0.0.1:$(env_value MARIADB_HOST_PORT 3307)."

stack_compose database/redis build "${build_option[@]}"
stack_compose database/redis up -d --no-build --wait --wait-timeout 120

stack_compose media build "${build_option[@]}"
bash "$SCRIPT_DIR/setup-media.sh"

deploy_target() {
  stack="$1"
  if [ "$MODE" = "reinstall" ]; then
    bash "$SCRIPT_DIR/deploy.sh" "$stack" --reinstall
  else
    bash "$SCRIPT_DIR/deploy.sh" "$stack" up
  fi
}

if [ "$TARGET" = "all" ]; then
  for stack in billing ecommerce b2bconnect sites; do
    deploy_target "$stack"
  done
  bash "$SCRIPT_DIR/smoke-test.sh"
else
  deploy_target "$TARGET"
fi

echo "CODEXSUN setup completed: mode=$MODE target=$TARGET"
