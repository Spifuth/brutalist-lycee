#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

APP_TAG="${APP_TAG:-brutalist-lycee:latest}"

echo "==> building $APP_TAG"
docker build --pull -t "$APP_TAG" .

echo
echo "Done. Images:"
docker images --filter=reference="$APP_TAG" \
  --format 'table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedSince}}'
