import 'dotenv/config';
import { SapphireClient } from '@sapphire/framework';
import {
  GatewayIntentBits,
  Partials,
} from 'discord.js';

import database from '@/config/db.js';
import { getLogger } from '@/config/logger.js';

type Bot = {
  client: SapphireClient;
};

let bot: Bot | undefined;

const main = async () => {
  const logger = getLogger();
  let client: SapphireClient;
  let db = database;

  if (!bot) {
    // Create a new client instance
    client = new SapphireClient({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Channel],
      loadMessageCommandListeners: true,
    });

    try {
      await db.authenticate();

      logger.info('Connection has been established successfully');
    } catch (error) {
      logger.error(`Unable to connect to the database: ${error}`);
    }

    bot = {
      client,
    };
  }

  bot.client.login(process.env.APP_BOT_TOKEN);
}

void main();
