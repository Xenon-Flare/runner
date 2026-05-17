#!/usr/bin/env bash
# Build the Docker image (context: runner/).
set -euo pipefail

RUNNER_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$RUNNER_ROOT"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "Usage: $0 [TAG]" >&2
  echo "  TAG default: xenonflare-runner:local (override: first arg or LOCAL_RUNNER_IMAGE)" >&2
  exit 0
fi

tag="${1:-${LOCAL_RUNNER_IMAGE:-xenonflare-runner:local}}"

require_cmd() { command -v "$1" >/dev/null 2>&1 || { echo "Missing: $1" >&2; exit 1; }; }
require_cmd docker

echo "==> docker build -t ${tag} ${RUNNER_ROOT}"
docker build -f Dockerfile -t "$tag" .
