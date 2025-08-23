# Discord - Albion Online Objectives

This Discord bot was specially created for the game "Albion Online", it allows player to add/list/remove objectives (nodes, cores and vortexes, more later ?) with all the necessary informations:

- Type (node, core, vortex)
- Rarity (4.4, [..], 8.4, green, blue...),
- Map
- Time remaining before objective unlock

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`APP_BOT_TOKEN` => Discord "Bot Token"

`APP_CLIENT_ID` => Discord "Application ID"

`APP_LOGTAIL_TOKEN` => Token from Logtail used by logger in Production

`APP_DEV_MODE` => true/false

`APP_DB_NAME` => SQLite Database name

`APP_DB_USER` => SQLite Database user

`APP_DB_PASSWORD` => SQLite Database user password

## Run Locally

Clone the project

```bash
  git clone https://github.com/AnTSaSk/discord-aoo
```

Go to the project directory

```bash
  cd discord-aoo
```

Install dependencies & create/synchronize the SQLite Database

```bash
  pnpm install

  // [OPTIONAL]
  pnpm run sync-db
```

Start the dev server

```bash
  pnpm run dev
```

## Support

For support, join our [Discord server](https://discord.gg/P4dmPCKnrY).

## License

GNU General Public License v3.0 or later

See [COPYING](COPYING) to see the full text.
