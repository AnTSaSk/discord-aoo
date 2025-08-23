#!/usr/bin/env bash

pm2 delete DiscordAOO || :
pm2 start
pm2 save
