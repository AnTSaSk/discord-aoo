#!/usr/bin/env bash
. "$(dirname "$0")/node.sh"

pm2 delete DiscordAOO || :
pm2 start
pm2 save
