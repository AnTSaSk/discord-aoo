import utc from 'dayjs/plugin/utc.js';
import dayjs from 'dayjs';
import { MessageFlags, type Client } from 'discord.js';
import type { Logger } from 'pino';
import { Op } from 'sequelize';

// Services
import { deleteObjective, findAllObjective, findObjectiveByGuildId } from '@/services/objective.service.js';

// Tasks
import { getMessage } from '@/tasks/message.js';

dayjs.extend(utc);

export const cronTask = async (logger: Logger, client: Client<true>) => {
  logger.info('-- CRON --');
  const now = dayjs().utc();

  logger.info('CRON - Get all past objectives');
  let objectives = await findAllObjective({
    order: [
      ['time', 'ASC'],
    ],
    where: {
      time: {
        [Op.lt]: now.toDate(),
      }
    },
  });

  // NO OBJECTIVE
  if (objectives.length <= 0) {
    logger.info('CRON - No objective');
    logger.info('-- END CRON --');

    return;
  }

  let guildData: Record<string, string>[] = [];

  logger.info('CRON - Delete old objective(s)');

  // Delete objectives
  for (const objective of objectives) {
    try {
      await deleteObjective(objective.id);

      if (!guildData.some((item) => item.guildId === objective.guildId)) {
        guildData.push({
          guildId: objective.guildId,
          channelId: objective.channelId,
        });
      }
    } catch (e) {
      logger.error(`Error during the delete of the objective: ${objective};
        Error: ${e}`);
    }
  }

  // For all guilds that have an updated list, send a new message
  if (guildData) {
    logger.info('CRON - Loop on each Guild data with an updated list');

    for (const key in guildData) {
      const data = guildData[key];

      if (data) {
        const channel = await client.channels.cache.get(data.channelId);
        const objectives = await findObjectiveByGuildId(data.guildId);

        // @TODO: Even when there is no objectives, send messages to remind users to add objectives
        if (objectives.length > 0) {
          logger.info(`CRON - Send new message on Guild: ${data.guildId} on the channel: ${data.channelId}`);

          // @ts-ignore
          await channel.send({
            components: getMessage(client, 'objective', objectives),
            flags: MessageFlags.IsComponentsV2,
          });
        }
      }
    }
  }

  logger.info('-- END CRON --');
};
