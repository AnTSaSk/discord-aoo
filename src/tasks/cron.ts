import utc from 'dayjs/plugin/utc.js';
import dayjs from 'dayjs';
import { MessageFlags, type Client, type TextChannel } from 'discord.js';
import type { Logger } from 'pino';
import { Op } from '@sequelize/core';

// Services
import { deleteObjective, findAllObjective, findObjectiveByGuildId } from '@/services/objective.service.js';

// Tasks
import { deletePreviousMessage, getMessage } from '@/tasks/message.js';

dayjs.extend(utc);

interface GuildData {
  guildId: string;
  channelId: string;
}

export const cronTask = async (logger: Logger, client: Client<true>): Promise<void> => {
  logger.info('-- CRON --');
  const now = dayjs().utc();

  logger.info('CRON - Get all past objectives');
  const objectives = await findAllObjective({
    order: [['time', 'ASC']],
    where: {
      time: {
        [Op.lte]: now.toDate(),
      },
    },
  });
  const guildData: GuildData[] = [];

  // NO PAST OBJECTIVE
  if (objectives.length <= 0) {
    logger.info('CRON - No past objective');
  } else {
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
      } catch (error) {
        logger.error(`Error during the delete of objective ID ${String(objective.id)}: ${String(error)}`);
      }
    }
  }

  // For all guilds that have an updated list, send a new message
  if (guildData.length >= 0) {
    logger.info('CRON - Loop on each Guild data with an updated list');

    for (const data of guildData) {
      const channel = client.channels.cache.get(data.channelId);

      if (channel) {
        const guildObjectives = await findObjectiveByGuildId(data.guildId);

        await deletePreviousMessage(client, channel.id);

        logger.info(`CRON - Send new message on Guild: ${data.guildId} on the channel: ${data.channelId}`);

        if (guildObjectives.length > 0) {
          await (channel as TextChannel).send({
            components: getMessage(client, 'objective', guildObjectives),
            flags: MessageFlags.IsComponentsV2,
          });
        } else {
          await (channel as TextChannel).send({
            components: getMessage(client, 'empty'),
            flags: MessageFlags.IsComponentsV2,
          });
        }
      }
    }
  }

  logger.info('-- END CRON --');
};
