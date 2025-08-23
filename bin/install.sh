#!/usr/bin/env bash
. "$(dirname "$0")/node.sh"

corepack enable pnpm && corepack install -g pnpm@10.15.0
npm install pm2 -g
