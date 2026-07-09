#!/usr/bin/env sh
set -eu

if [ -z "${CONTAINER_DIR:-}" ]; then
  CALLER_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
  if [ "$(basename "$CALLER_DIR")" = "scripts" ]; then
    CONTAINER_DIR=$(CDPATH= cd -- "$CALLER_DIR/.." && pwd)
  else
    CONTAINER_DIR="$CALLER_DIR"
  fi
fi
PROJECT_ROOT=$(CDPATH= cd -- "$CONTAINER_DIR/.." && pwd)
COMPOSE_FILE="$CONTAINER_DIR/docker-compose.yml"
ENV_FILE="$CONTAINER_DIR/deploy.env"

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

ensure_env() {
  if [ ! -f "$ENV_FILE" ]; then
    cp "$CONTAINER_DIR/deploy.env.example" "$ENV_FILE"
    echo "Created $ENV_FILE from deploy.env.example."
    echo "Edit secrets before a production deploy."
  fi
}

env_value() {
  key="$1"
  default_value="${2:-}"
  if [ -f "$ENV_FILE" ]; then
    value=$(grep -E "^${key}=" "$ENV_FILE" | tail -n 1 | cut -d= -f2- || true)
    if [ -n "${value:-}" ]; then
      printf "%s" "$value"
      return
    fi
  fi
  printf "%s" "$default_value"
}

set_env_value() {
  key="$1"
  value="$2"
  tmp="$ENV_FILE.tmp"
  if grep -qE "^${key}=" "$ENV_FILE"; then
    sed "s|^${key}=.*|${key}=${value}|" "$ENV_FILE" > "$tmp"
  else
    cp "$ENV_FILE" "$tmp"
    printf "\n%s=%s\n" "$key" "$value" >> "$tmp"
  fi
  mv "$tmp" "$ENV_FILE"
}

generate_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  else
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  fi
}

ensure_secret() {
  key="$1"
  current=$(env_value "$key" "")
  case "$current" in
    ""|change_this*|change-me-now|change_this_with_openssl_rand_hex_32)
      set_env_value "$key" "$(generate_secret)"
      echo "Generated $key."
      ;;
  esac
}

profiles_args() {
  db_mode=$(env_value CODEXSUN_DB_MODE internal)
  redis_mode=$(env_value CODEXSUN_REDIS_MODE internal)
  args=""
  if [ "$db_mode" = "internal" ]; then
    args="$args --profile internal-db"
    set_env_value DB_HOST mariadb
  fi
  if [ "$redis_mode" = "internal" ]; then
    args="$args --profile internal-redis"
    set_env_value CODEXSUN_REDIS_URL redis://redis:6379
    set_env_value REDIS_ADMIN_HOSTS local:redis:6379
  fi
  if [ "$(env_value CODEXSUN_ADMIN_TOOLS 0)" = "1" ]; then
    args="$args --profile admin"
  fi
  printf "%s" "$args"
}

require_docker() {
  docker version >/dev/null 2>&1 || {
    echo "Docker is not available. Install Docker Engine and Compose plugin first."
    exit 69
  }
}

run_preflight() {
  require_docker
  ensure_env
  ensure_secret JWT_SECRET
  ensure_secret FILE_SERVER_PASSWORD
}
