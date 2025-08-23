#!/usr/bin/env bash

echo "Change Node version to latest Node LTS version (Gallium - 16.x.x)"

NODEVERSION=$(node -v)

if [[ $NODEVERSION != "v24."* ]]
then
    [ -s "$HOME/.nvm/nvm.sh" ] && \. "$HOME/.nvm/nvm.sh"
    nvm install 24.6.0
    nvm use 24.6.0
fi

corepack enable pnpm && corepack install -g pnpm@10.15.0
npm install pm2 -g
