#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=.container/scripts/common.sh
. "$SCRIPT_DIR/scripts/common.sh"

STACK=${1:-}
ACTION=${2:-up}

usage() {
  cat <<'EOF'
Usage: .container/deploy.sh billing {up|--reinstall|build|migrate|ps|logs|down}

  up           Build, migrate, and start Billing.
  --reinstall  Remove only Billing containers/images, rebuild without cache,
               run forward migrations, and start Billing. Data is preserved.
  build        Build the Billing images.
  migrate      Run safe forward migrations and print migration state.
  ps           Show Billing containers.
  logs         Follow Billing logs.
  down         Remove only Billing containers. Volumes are preserved.

This command never starts, stops, recreates, or removes MariaDB, Redis, or Media.
EOF
}

[ "$STACK" = "billing" ] || {
  usage >&2
  exit 64
}

case "$ACTION" in
  up|--reinstall|build|migrate|ps|logs|down) ;;
  -h|--help) usage; exit 0 ;;
  *) usage >&2; exit 64 ;;
esac

prepare_deploy_env
validate_deploy_env
require_docker

require_billing_dependencies() {
  network=$(env_value CODEXSUN_DOCKER_NETWORK codexsun-network)
  media_data=$(env_value MEDIA_DATA_VOLUME codexsun-media-data)

  docker network inspect "$network" >/dev/null 2>&1 || {
    echo "Required Docker network is missing: $network" >&2
    echo "Run: bash .container/setup.sh" >&2
    exit 69
  }
  docker volume inspect "$media_data" >/dev/null 2>&1 || {
    echo "Required Media volume is missing: $media_data" >&2
    echo "Run: bash .container/setup.sh" >&2
    exit 69
  }

  for container in codexsun-mariadb codexsun-redis; do
    state=$(docker inspect "$container" --format '{{.State.Status}}' 2>/dev/null || true)
    health=$(docker inspect "$container" \
      --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
      2>/dev/null || true)
    [ "$state" = "running" ] && [ "$health" = "healthy" ] || {
      echo "Required dependency is not healthy: $container (state=${state:-missing}, health=${health:-missing})" >&2
      echo "deploy.sh will not modify infrastructure. Run: bash .container/setup.sh" >&2
      exit 69
    }
  done
}

billing_image() {
  suffix="$1"
  tag_key="$2"
  default_tag="$3"
  registry=$(env_value CODEXSUN_IMAGE_REGISTRY codexsun)
  tag=$(env_value "$tag_key" "$default_tag")
  printf '%s/billing-stack-%s:%s' "$registry" "$suffix" "$tag"
}

remove_billing_images() {
  for image in \
    "$(billing_image api BILLING_STACK_API_IMAGE_TAG 1.0.33)" \
    "$(billing_image web BILLING_STACK_WEB_IMAGE_TAG 1.0.33)" \
    "$(billing_image migrations BILLING_STACK_MIGRATIONS_IMAGE_TAG 1.0.33)"; do
    if docker image inspect "$image" >/dev/null 2>&1; then
      docker image rm "$image" >/dev/null || {
        echo "Failed to remove Billing image: $image" >&2
        exit 74
      }
      echo "Removed Billing image: $image"
    fi
  done
}

build_billing() {
  stack_compose billing --profile tools config --quiet
  stack_compose billing --profile tools build "$@"
}

migrate_billing() {
  require_billing_dependencies
  echo "Checking and applying forward database migrations. Database deletion is disabled."
  stack_compose billing --profile tools run --rm platform-migrate
  echo "Applied migration state:"
  stack_compose billing --profile tools run --rm platform-migrate npm run db:migrations:list
}

start_billing() {
  require_billing_dependencies
  stack_compose billing up -d --no-build --remove-orphans --wait --wait-timeout 240
}

up_billing() {
  build_billing
  migrate_billing
  start_billing
}

reinstall_billing() {
  require_billing_dependencies
  echo "Removing Billing containers only. Database and all named volumes are preserved."
  stack_compose billing down --remove-orphans
  remove_billing_images
  build_billing --pull --no-cache
  migrate_billing
  start_billing
}

case "$ACTION" in
  up) up_billing ;;
  --reinstall) reinstall_billing ;;
  build) build_billing ;;
  migrate) migrate_billing ;;
  ps) stack_compose billing ps ;;
  logs) stack_compose billing logs -f --tail=150 ;;
  down) stack_compose billing down --remove-orphans ;;
esac

echo "Billing action completed: $ACTION"
