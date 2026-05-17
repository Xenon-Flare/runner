#!/usr/bin/env bash
# Local worker: npm start (requires dist/ from ./scripts/build/build.sh or npm run build).
set -euo pipefail

RUNNER_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$RUNNER_ROOT"

if [[ ! -f package.json ]]; then
  echo "Expected package.json under ${RUNNER_ROOT}" >&2
  exit 1
fi

npm start
