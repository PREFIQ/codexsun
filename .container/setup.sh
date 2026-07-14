#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/scripts/common.sh"

ensure_env
echo "Deployment environment: $ENV_FILE"
echo "Review public origins, API URLs, and generated secrets before exposing services."
printf "Deploy method [upgrade/reinstall] (upgrade): "
read method || method=""

case "${method:-upgrade}" in
  upgrade) exec "$SCRIPT_DIR/upgrade-containers.sh" ;;
  reinstall|hard-reinstall) exec "$SCRIPT_DIR/hard-reinstall.sh" ;;
  *) echo "Unknown method: $method" >&2; exit 64 ;;
esac
