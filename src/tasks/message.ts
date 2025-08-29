import utc from 'dayjs/plugin/utc.js';
import dayjs from 'dayjs';
import { Collection, Message, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder } from 'discord.js';
import type { SapphireClient } from '@sapphire/framework';

dayjs.extend(utc);

// Constants
import {
  RARITY_4_4,
  RARITY_5_4,
  RARITY_6_4,
  RARITY_7_4,
  RARITY_8_4,
  RARITY_COMMON,
  RARITY_EPIC,
  RARITY_LEGENDARY,
  RARITY_RARE,
} from '@/constants/rarity.js';
import {
  TYPE_CORE,
  TYPE_NODE_FIBER,
  TYPE_NODE_HIDE,
  TYPE_NODE_ORE,
  TYPE_NODE_WOOD,
  TYPE_VORTEX,
} from '@/constants/type.js';

// Models
import type { Objective } from '@/models/objective.model.js';

export const deletePreviousMessage = async (client: SapphireClient, channelId: string) => {
  const channel = client.channels.cache.get(channelId);

  if (channel) {
    // @ts-ignore
    let messages: Collection<Message> = await channel?.messages?.fetch({ limit: 10 });

    if (messages) {
      messages = Array.from(messages);
      messages = messages?.filter((item: (string | Message)[]) => {
        const message = item?.[1];

        if (message instanceof Message) {
          return message?.author?.id === process.env.APP_CLIENT_ID;
        }

        return false;
      });

      for (const item of messages) {
        const message = item?.[1];

        if (message instanceof Message && message.deletable) {
          message.delete().catch(() => null);
        }
      }
    }
  }
}

const displayObjective = (client: SapphireClient, data: Objective[]): any[] => {
  const content: any[] = [];
  const objectiveIndex: Record<string, number>[] = [];

  data.forEach((objective, index) => {
    objectiveIndex.push({
      id: objective.id,
      index: index + 1,
    });
  });

  const objectiveNode = data.filter((item) =>
    item.type === TYPE_NODE_FIBER ||
    item.type === TYPE_NODE_HIDE ||
    item.type === TYPE_NODE_ORE ||
    item.type === TYPE_NODE_WOOD
  );
  const objectiveCore = data.filter((item) => item.type === TYPE_CORE);
  const objectiveVortex = data.filter((item) => item.type === TYPE_VORTEX);
  let globalIndex = 0;

  [objectiveNode, objectiveCore, objectiveVortex].forEach((category, index) => {
    if (category.length > 0) {
      let categoryName = '';

      switch (index) {
        case 0:
          categoryName = '## Node ##';
          break;
        case 1:
          categoryName = '## Core ##';
          break;
        case 2:
          categoryName = '## Vortex ##';
          break;
      }

      const textDisplayCategoryName = new TextDisplayBuilder()
        .setContent(`${categoryName}`);

      content.push(textDisplayCategoryName);

      category.forEach((item) => {
        let objectiveRarity = '';

        globalIndex += 1;

        // Prefix with emoji
        switch (item.rarity) {
          case RARITY_4_4:
          case RARITY_5_4:
          case RARITY_6_4:
          case RARITY_7_4:
          case RARITY_8_4:
            objectiveRarity = `**${item.rarity} ${item.type}**`;
            break;
          case RARITY_COMMON:
            objectiveRarity = `**:green_circle: ${item.rarity}**`;
            break;
          case RARITY_RARE:
            objectiveRarity = `**:blue_circle: ${item.rarity}**`;
            break;
          case RARITY_EPIC:
            objectiveRarity = `**:purple_circle: ${item.rarity}**`;
            break;
          case RARITY_LEGENDARY:
            objectiveRarity = `**:orange_circle: ${item.rarity}**`;
            break;
        }

        const itemData = objectiveIndex.find((o: Record<string, number>) => o.id === item.id);
        const maintenance = item.maintenanceAdded ? ':white_check_mark:' : ':x:';
        const user = client.users.cache.find((user) => user.id === item.userId);

        const textDisplayList = new TextDisplayBuilder()
          .setContent(
            `- #${itemData?.index} — ${objectiveRarity} —— **${dayjs(item.time).utc().format('HH:mm')}** UTC (<t:${dayjs(item.time).unix()}:R>) —— **${item.map}**
-# Maintenance added: ${maintenance} —— Objective added by ${user?.displayName}`
          );

        content.push(textDisplayList);
      });

      const separator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

      content.push(separator);
    }
  });

  return content;
}

export const getMessage = (client: SapphireClient, type: String, data: any): any[] => {
  let content = [];

  switch (type) {
    case 'objective':
      content = displayObjective(client, data);
      break;
  }

  return content;
};
