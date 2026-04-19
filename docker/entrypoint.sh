#!/bin/sh
set -eu

ENV_FILE="${ENV_FILE:-/app/.env}"

if [ -f "$ENV_FILE" ]; then
  echo "Loading environment from $ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
else
  echo "Environment file not found at $ENV_FILE, using injected environment variables"
fi

exec "$@"
