#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=.container/scripts/common.sh
. "$SCRIPT_DIR/scripts/common.sh"

MODE=install

usage() {
  cat <<'EOF'
Usage: .container/setup.sh [--reinstall]

  no option     Install/start MariaDB, Redis, Media, then Billing.
  --reinstall   Cleanly replace every stack container and image, then run safe
                forward migrations. All databases, uploads, and volumes remain.

No setup mode deletes a Docker volume or drops a database.
EOF
}

case "${1:-}" in
  "") ;;
  --reinstall) MODE=reinstall ;;
  -h|--help) usage; exit 0 ;;
  *) usage >&2; exit 64 ;;
esac
[ "$#" -le 1 ] || { usage >&2; exit 64; }

run_preflight

infrastructure_image() {
  stack="$1"
  registry=$(env_value CODEXSUN_IMAGE_REGISTRY codexsun)
  case "$stack" in
    mariadb) tag=$(env_value MARIADB_IMAGE_TAG 11.8-codexsun-1.0.33) ;;
    redis) tag=$(env_value REDIS_IMAGE_TAG 7.4-codexsun-1.0.33) ;;
    media) tag=$(env_value MEDIA_IMAGE_TAG 1.0.33-filebrowser2.63.5) ;;
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
  bash "$SCRIPT_DIR/deploy.sh" billing down
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
echo "MariaDB application grants reconciled."

stack_compose database/redis build "${build_option[@]}"
stack_compose database/redis up -d --no-build --wait --wait-timeout 120

stack_compose media build "${build_option[@]}"
bash "$SCRIPT_DIR/setup-media.sh"

if [ "$MODE" = "reinstall" ]; then
  bash "$SCRIPT_DIR/deploy.sh" billing --reinstall
else
  bash "$SCRIPT_DIR/deploy.sh" billing up
fi

echo "CODEXSUN setup completed: $MODE"
