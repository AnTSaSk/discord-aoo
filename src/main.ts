import { SapphireClient } from '@sapphire/framework';
import {
  GatewayIntentBits,
  Partials,
} from 'discord.js';

import database from '@/config/db.js';
import { getLogger } from '@/config/logger.js';
import { getRequiredSecret } from '@/utils/secrets.js';

// Load dotenv only in development
if (process.env.NODE_ENV !== 'production') {
  await import('dotenv/config');
}

type Bot = {
  client: SapphireClient;
};

let bot: Bot | undefined;

const main = async () => {
  const logger = getLogger();
  let client: SapphireClient;
  const db = database;

  // Get Discord token from secret or env var
  const token = getRequiredSecret('APP_BOT_TOKEN', 'Discord bot token');

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
      process.exit(1);
    }

    bot = {
      client,
    };
  }

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    try {
      bot?.client.destroy();
      await db.close();
      logger.info('Shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error(`Error during shutdown: ${error}`);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  bot.client.login(token);
};

void main();
