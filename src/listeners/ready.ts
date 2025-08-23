import type { Client } from 'discord.js';
import { Listener } from '@sapphire/framework';
import cron from 'node-cron';

// Config
import { getLogger } from '@/config/logger.js';

// Models
import ObjectiveModel from '@/models/objective.model.js';

// Tasks
import { cronTask } from '@/tasks/cron.js';

export class ReadyListener extends Listener {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      once: true,
      event: 'ready',
    })
  }

  public override run(client: Client<true>) {
    const logger = getLogger();
    const { displayName } = client.user!;

    logger.info(`Logged in as ${displayName}`);

    ObjectiveModel.sync();

    logger.info(`All models were synchronized successfully`);

    cron.schedule('0 6 * * *', () => cronTask(logger, client));
  }
}
