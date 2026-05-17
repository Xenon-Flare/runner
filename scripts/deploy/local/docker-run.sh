#!/usr/bin/env bash
# Run the local Docker image (expects .env with RUNNER_* and OPENAI_*).
set -euo pipefail

RUNNER_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$RUNNER_ROOT"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "Usage: $0 [-- IMAGE_ARGS...]" >&2
  echo "  Reads ${RUNNER_ROOT}/.env by default." >&2
  echo "  Env: LOCAL_RUNNER_IMAGE (default xenonflare-runner:local), RUNNER_ENV_FILE (default .env)" >&2
  exit 0
fi

image="${LOCAL_RUNNER_IMAGE:-xenonflare-runner:local}"
env_file="${RUNNER_ENV_FILE:-.env}"

require_cmd() { command -v "$1" >/dev/null 2>&1 || { echo "Missing: $1" >&2; exit 1; }; }
require_cmd docker

if [[ ! -f "$env_file" ]]; then
  echo "Missing ${RUNNER_ROOT}/${env_file}. Copy .env.example and fill values." >&2
  exit 1
fi

docker_args=()
if [[ $# -gt 0 ]]; then
  if [[ "$1" == "--" ]]; then shift; fi
  docker_args=("$@")
fi

echo "==> docker run --rm --env-file ${env_file} ${image}"
exec docker run --rm --env-file "$env_file" "${docker_args[@]}" "$image"
