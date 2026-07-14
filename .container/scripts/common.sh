#!/usr/bin/env sh
set -eu

CONTAINER_DIR=${CONTAINER_DIR:-$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)}
if [ "$(basename "$CONTAINER_DIR")" = "scripts" ]; then
  CONTAINER_DIR=$(CDPATH= cd -- "$CONTAINER_DIR/.." && pwd)
fi
PROJECT_ROOT=$(CDPATH= cd -- "$CONTAINER_DIR/.." && pwd)
COMPOSE_FILE="$CONTAINER_DIR/docker-compose.yml"
ENV_FILE=${CODEXSUN_ENV_FILE_PATH:-$CONTAINER_DIR/deploy.env}

compose() {
  CODEXSUN_ENV_FILE="$ENV_FILE" docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

stack_compose() {
  stack_file="$1"
  shift
  docker compose --env-file "$ENV_FILE" -f "$CONTAINER_DIR/$stack_file" "$@"
}

ensure_env() {
  if [ ! -f "$ENV_FILE" ]; then
    cp "$CONTAINER_DIR/deploy.env.example" "$ENV_FILE"
    echo "Created $ENV_FILE. Generated placeholders will be replaced, but public URLs must be reviewed."
  fi
}

env_value() {
  key="$1"
  default_value=${2:-}
  value=$(grep -E "^${key}=" "$ENV_FILE" 2>/dev/null | tail -n 1 | cut -d= -f2- || true)
  printf "%s" "${value:-$default_value}"
}

set_env_value() {
  key="$1"
  value="$2"
  tmp="$ENV_FILE.tmp"
  KEY="$key" VALUE="$value" awk '
    BEGIN { found = 0 }
    index($0, ENVIRON["KEY"] "=") == 1 {
      print ENVIRON["KEY"] "=" ENVIRON["VALUE"]
      found = 1
      next
    }
    { print }
    END {
      if (!found) print ENVIRON["KEY"] "=" ENVIRON["VALUE"]
    }
  ' "$ENV_FILE" > "$tmp"
  mv "$tmp" "$ENV_FILE"
}

repo_env_value() {
  key="$1"
  repo_env="$PROJECT_ROOT/.env"
  value=$(grep -E "^${key}=" "$repo_env" 2>/dev/null | tail -n 1 | cut -d= -f2- || true)
  value=$(printf "%s" "$value" | tr -d '\r')
  case "$value" in
    \"*\") value=${value#\"}; value=${value%\"} ;;
    \'*\') value=${value#\'}; value=${value%\'} ;;
  esac
  printf "%s" "$value"
}

sync_storage_admin_password() {
  super_admin_password=$(repo_env_value SUPER_ADMIN_PASSWORD)
  if [ -n "$super_admin_password" ]; then
    set_env_value PICTURES_ADMIN_PASSWORD "$super_admin_password"
    set_env_value FILES_ADMIN_PASSWORD "$super_admin_password"
    PICTURES_ADMIN_PASSWORD="$super_admin_password"
    FILES_ADMIN_PASSWORD="$super_admin_password"
    export PICTURES_ADMIN_PASSWORD FILES_ADMIN_PASSWORD
    echo "Synchronized Pictures and Files admin credentials from repository .env."
  fi
}

generate_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  elif command -v node >/dev/null 2>&1; then
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  else
    od -An -N32 -tx1 /dev/urandom | tr -d ' \n'
  fi
}

ensure_secret() {
  key="$1"
  current=$(env_value "$key" "")
  case "$current" in
    ""|change_this*)
      set_env_value "$key" "$(generate_secret)"
      echo "Generated $key."
      ;;
  esac
}

validate_deploy_env() {
  case "$(env_value CODEXSUN_QUEUE_BACKEND bullmq-redis)" in
    database|bullmq-redis) ;;
    *) echo "CODEXSUN_QUEUE_BACKEND must be database or bullmq-redis." >&2; exit 64 ;;
  esac

  if [ "$(env_value NODE_ENV production)" = "production" ]; then
    if [ "$(env_value CODEXSUN_DB_FRESH_ON_START 0)" != "0" ] || \
       [ "$(env_value CODEXSUN_ALLOW_PRODUCTION_DB_RESET 0)" != "0" ]; then
      echo "Refusing production deploy while destructive database reset flags are enabled." >&2
      exit 78
    fi
  fi
}

require_docker() {
  docker info >/dev/null 2>&1 || {
    echo "Docker Engine is not reachable." >&2
    exit 69
  }
}

ensure_network() {
  network=$(env_value CODEXSUN_DOCKER_NETWORK codexsun-network)
  docker network inspect "$network" >/dev/null 2>&1 || docker network create "$network" >/dev/null
}

ensure_shared_storage_volumes() {
  for volume in \
    "$(env_value PICTURES_DATA_VOLUME codexsun-pictures-data)" \
    "$(env_value PICTURES_DB_VOLUME codexsun-pictures-db)" \
    "$(env_value FILES_DATA_VOLUME codexsun-files-data)" \
    "$(env_value FILES_DB_VOLUME codexsun-files-db)"; do
    docker volume inspect "$volume" >/dev/null 2>&1 || docker volume create "$volume" >/dev/null
  done
}

run_preflight() {
  ensure_env
  sync_storage_admin_password
  ensure_secret JWT_SECRET
  ensure_secret DB_PASSWORD
  ensure_secret MARIADB_ROOT_PASSWORD
  ensure_secret PICTURES_ADMIN_PASSWORD
  ensure_secret FILES_ADMIN_PASSWORD
  validate_deploy_env
  require_docker
  ensure_network
  ensure_shared_storage_volumes
}
