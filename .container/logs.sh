#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/scripts/common.sh"

ensure_env
if [ "$#" -gt 0 ]; then
  compose logs -f "$@"
else
  compose logs -f
fi
