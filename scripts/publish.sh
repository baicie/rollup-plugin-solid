#!/bin/sh

set -e

pnpm i --frozen-lockfile --ignore-scripts

pnpm build

pnpm publish-script

echo "✅ Publish completed"
