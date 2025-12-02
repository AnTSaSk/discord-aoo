import type { FindOptions, InferAttributes } from '@sequelize/core';

// Models
import ObjectiveModel, { type Objective } from '@/models/objective.model.js';

export const findAllObjective = async (options?: FindOptions<InferAttributes<Objective>>) => ObjectiveModel.findAll(options);

export const findObjectiveByGuildId = async (guildId: string): Promise<Objective[]> => ObjectiveModel.findAll({
  order: [
    ['time', 'ASC'],
  ],
  where: {
    guildId,
  }
});

export const findObjectiveById = async (id: string): Promise<Objective[]> => ObjectiveModel.findAll({
  where: {
    id,
  }
});

export const createObjective = async (
  data: Pick<Objective, 'guildId' | 'channelId' | 'userId' | 'type' | 'rarity' | 'map' | 'time' | 'maintenanceAdded'>
): Promise<Objective> => ObjectiveModel.create({
  guildId: data.guildId,
  channelId: data.channelId,
  userId: data.userId,
  type: data.type,
  rarity: data.rarity,
  map: data.map,
  time: data.time,
  maintenanceAdded: data.maintenanceAdded,
});

export const deleteObjective = async (id: number): Promise<number> => ObjectiveModel.destroy({
  where: {
    id,
  }
});
