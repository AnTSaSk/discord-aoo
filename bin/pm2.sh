#!/usr/bin/env bash
. "$(dirname "$0")/node.sh"

pm2 delete DiscordAOO -s || :
pm2 start ecosystem.config.cjs -s
pm2 save -s
