#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=.container/scripts/common.sh
. "$SCRIPT_DIR/scripts/common.sh"

CLEAN_INSTALL=false
WIPE_MEDIA=false

for arg in "$@"; do
  case "$arg" in
    --clean|--fresh|--reinstall) CLEAN_INSTALL=true ;;
    --wipe-media) WIPE_MEDIA=true ;;
    -h|--help)
      echo "Usage: .container/setup-media.sh [--reinstall] [--wipe-media]"
      echo "  --reinstall   Recreate Pictures/Files metadata DB volumes; content is preserved."
      echo "  --wipe-media  Also remove picture and file content volumes (destructive)."
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 64
      ;;
  esac
done

if [ "$WIPE_MEDIA" = "true" ] && [ "$CLEAN_INSTALL" != "true" ]; then
  echo "--wipe-media must be combined with --reinstall." >&2
  echo "Usage: .container/setup-media.sh --reinstall --wipe-media" >&2
  exit 64
fi

ensure_env
super_admin_password="$(repo_env_value SUPER_ADMIN_PASSWORD)"
if [ -z "$super_admin_password" ]; then
  echo "SUPER_ADMIN_PASSWORD is required in $PROJECT_ROOT/.env." >&2
  exit 78
fi

set_env_value PICTURES_ADMIN_PASSWORD "$super_admin_password"
set_env_value FILES_ADMIN_PASSWORD "$super_admin_password"
export PICTURES_ADMIN_PASSWORD="$super_admin_password"
export FILES_ADMIN_PASSWORD="$super_admin_password"

run_preflight

pictures_data="$(env_value PICTURES_DATA_VOLUME codexsun-pictures-data)"
pictures_db="$(env_value PICTURES_DB_VOLUME codexsun-pictures-db)"
files_data="$(env_value FILES_DATA_VOLUME codexsun-files-data)"
files_db="$(env_value FILES_DB_VOLUME codexsun-files-db)"
pictures_admin_user="$(env_value PICTURES_ADMIN_USER admin)"
files_admin_user="$(env_value FILES_ADMIN_USER admin)"
registry="$(env_value CODEXSUN_IMAGE_REGISTRY codexsun)"
pictures_tag="$(env_value PICTURES_IMAGE_TAG 1.0.32-filebrowser2.63.5)"
files_tag="$(env_value FILES_IMAGE_TAG 1.0.32-filebrowser2.63.5)"
pictures_image="${registry}/pictures:${pictures_tag}"
files_image="${registry}/files:${files_tag}"

assert_no_external_volume_users() {
  volume="$1"
  users=$(docker ps -a --filter "volume=$volume" --format '{{.Names}}' \
    | grep -Ev '^(codexsun-pictures|codexsun-files)$' || true)
  if [ -n "$users" ]; then
    echo "Cannot wipe $volume; these containers still use it:" >&2
    printf '%s\n' "$users" >&2
    echo "Remove the dependent containers with the full-stack Compose down command first." >&2
    exit 73
  fi
}

remove_volume_verified() {
  volume="$1"
  if ! docker volume inspect "$volume" >/dev/null 2>&1; then
    echo "Volume already absent: $volume"
    return
  fi

  users=$(docker ps -a --filter "volume=$volume" --format '{{.Names}}')
  if [ -n "$users" ]; then
    echo "Cannot remove $volume; these containers still use it:" >&2
    printf '%s\n' "$users" >&2
    exit 73
  fi

  if ! docker volume rm "$volume" >/dev/null; then
    echo "Docker failed to remove volume: $volume" >&2
    exit 74
  fi
  if docker volume inspect "$volume" >/dev/null 2>&1; then
    echo "Volume still exists after removal command: $volume" >&2
    exit 74
  fi
  echo "Removed volume: $volume"
}

stack_compose storage/docker-compose.yml build

if [ "$CLEAN_INSTALL" = "true" ]; then
  if [ "$WIPE_MEDIA" = "true" ]; then
    assert_no_external_volume_users "$pictures_data"
    assert_no_external_volume_users "$files_data"
  fi

  echo "Recreating Pictures and Files metadata databases."
  stack_compose storage/docker-compose.yml down --remove-orphans
  remove_volume_verified "$pictures_db"
  remove_volume_verified "$files_db"

  if [ "$WIPE_MEDIA" = "true" ]; then
    remove_volume_verified "$pictures_data"
    remove_volume_verified "$files_data"
  else
    echo "Picture and file content volumes are preserved."
  fi
fi

ensure_shared_storage_volumes
stack_compose storage/docker-compose.yml stop pictures files >/dev/null 2>&1 || true

ensure_filebrowser_admin() {
  image="$1"
  content_volume="$2"
  database_volume="$3"
  media_admin_user="$4"

  docker run --rm \
    --user 0:0 \
    --entrypoint sh \
    -e MEDIA_ADMIN_USER="$media_admin_user" \
    -e MEDIA_ADMIN_PASSWORD="$super_admin_password" \
    -v "$content_volume:/srv" \
    -v "$database_volume:/database" \
    "$image" \
    -lc 'mkdir -p /srv /database && chmod 0775 /srv /database || true
      filebrowser config init --database /database/filebrowser.db >/dev/null 2>&1 || true
      filebrowser config set --root /srv --scope / --database /database/filebrowser.db >/dev/null
      filebrowser users update "$MEDIA_ADMIN_USER" \
        --password "$MEDIA_ADMIN_PASSWORD" \
        --scope / \
        --perm.admin --perm.create --perm.delete --perm.download \
        --perm.modify --perm.rename --perm.share \
        --database /database/filebrowser.db >/dev/null 2>&1 \
      || filebrowser users add "$MEDIA_ADMIN_USER" "$MEDIA_ADMIN_PASSWORD" \
        --scope / \
        --perm.admin --perm.create --perm.delete --perm.download \
        --perm.modify --perm.rename --perm.share \
        --database /database/filebrowser.db >/dev/null'
}

echo "Ensuring Pictures administrator."
ensure_filebrowser_admin "$pictures_image" "$pictures_data" "$pictures_db" "$pictures_admin_user"
echo "Ensuring Files administrator."
ensure_filebrowser_admin "$files_image" "$files_data" "$files_db" "$files_admin_user"

stack_compose storage/docker-compose.yml up -d --no-build --wait --wait-timeout 120
stack_compose storage/docker-compose.yml ps

echo "Pictures and Files are ready. Admin password matches SUPER_ADMIN_PASSWORD from .env."
