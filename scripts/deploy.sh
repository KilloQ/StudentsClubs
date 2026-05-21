#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

git fetch origin main
git reset --hard origin/main

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

docker compose build
docker compose up -d --remove-orphans
