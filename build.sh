#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

APP_TAG="${APP_TAG:-brutalist-lycee:latest}"
GATEWAY_TAG="${GATEWAY_TAG:-brutalist-lycee-gateway:latest}"

echo "==> building $APP_TAG"
docker build --pull -t "$APP_TAG" .

# gateway/ is a standalone Node service, not part of the Next.js build (see
# gateway/README.md). Its compose service stays behind `profiles: ["gateway"]`
# and is not started by this build — building the image is not enabling it.
echo "==> building $GATEWAY_TAG"
docker build --pull -t "$GATEWAY_TAG" ./gateway

echo
echo "Done. Images:"
docker images --filter=reference="$APP_TAG" --filter=reference="$GATEWAY_TAG" \
  --format 'table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedSince}}'
