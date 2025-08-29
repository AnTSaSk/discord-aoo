import dayjs from 'dayjs';
import { Command } from '@sapphire/framework';
import {
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  type SlashCommandStringOption,
} from 'discord.js';

// Config
import { getLogger } from '@/config/logger.js';

// Constants
import { MAPS } from '@/constants/map.js';
import { RARITIES, RARITY_4_4, RARITY_5_4, RARITY_6_4, RARITY_7_4, RARITY_8_4, RARITY_COMMON, RARITY_EPIC, RARITY_LEGENDARY, RARITY_RARE } from '@/constants/rarity.js';
import { TYPE_CORE, TYPE_NODE_FIBER, TYPE_NODE_HIDE, TYPE_NODE_ORE, TYPE_NODE_WOOD, TYPE_VORTEX, TYPES } from '@/constants/type.js';

// Services
import {
  createObjective,
  deleteObjective,
  findObjectiveByGuildId,
} from '@/services/objective.service.js';

// Tasks
import { deletePreviousMessage, getMessage } from '@/tasks/message.js';
import { getRelativeTime, isMaintenanceAdded } from '@/tasks/date.js';

export class AddObjectiveCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'add',
      description: 'Add new objective',
      cooldownDelay: 2_000,
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    const integrationTypes: ApplicationIntegrationType[] = [ApplicationIntegrationType.GuildInstall];
    const contexts: InteractionContextType[] = [
      InteractionContextType.Guild,
    ];

    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setIntegrationTypes(integrationTypes)
        .setContexts(contexts)
        .addStringOption((option: SlashCommandStringOption) =>
          option
            .setName('type')
            .setDescription('Type of objective')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption((option: SlashCommandStringOption) =>
          option
            .setName('rarity')
            .setDescription('Rarity of the objective')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption((option: SlashCommandStringOption) =>
          option
            .setName('map')
            .setDescription('Name of the map where the objective is')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption((option: SlashCommandStringOption) =>
          option
            .setName('time')
            .setDescription('Time remaining in hh:mm format')
            .setRequired(true)
            .setAutocomplete(false)
        )
    );
  }

  public override async autocompleteRun(interaction: Command.AutocompleteInteraction) {
    const focusedOption = interaction.options.getFocused(true);
    const typeOption = interaction.options.getString('type');
    const rarityOption = interaction.options.getString('rarity');
    let choices: string[] = [];

    switch (focusedOption.name) {
      case 'type':
        choices = TYPES;

        if (rarityOption) {
          switch (rarityOption) {
            case RARITY_4_4:
            case RARITY_5_4:
            case RARITY_6_4:
            case RARITY_7_4:
            case RARITY_8_4:
              choices = choices.filter((choice) =>
                choice === TYPE_NODE_FIBER ||
                choice === TYPE_NODE_HIDE ||
                choice === TYPE_NODE_ORE ||
                choice === TYPE_NODE_WOOD
              );
              break;

            case RARITY_COMMON:
            case RARITY_RARE:
            case RARITY_EPIC:
            case RARITY_LEGENDARY:
              choices = choices.filter((choice) =>
                choice === TYPE_CORE ||
                choice === TYPE_VORTEX
              );
              break;
          }
        }
        break;

      case 'rarity':
        choices = RARITIES;

        if (typeOption) {
          switch (typeOption) {
            case TYPE_NODE_FIBER:
            case TYPE_NODE_HIDE:
            case TYPE_NODE_ORE:
            case TYPE_NODE_WOOD:
              choices = choices.filter((choice) =>
                choice === RARITY_4_4 ||
                choice === RARITY_5_4 ||
                choice === RARITY_6_4 ||
                choice === RARITY_7_4 ||
                choice === RARITY_8_4
              );
              break;

            case TYPE_CORE:
            case TYPE_VORTEX:
              choices = choices.filter((choice) =>
                choice === RARITY_COMMON ||
                choice === RARITY_RARE ||
                choice === RARITY_EPIC ||
                choice === RARITY_LEGENDARY
              );
              break;
          }
        }
        break;

      case 'map':
        choices = MAPS;
        break;
    }

    let filteredChoices = focusedOption.value ? choices.filter((choice) =>
      choice.toLowerCase().startsWith(focusedOption.value.toLowerCase()) ||
      choice.toLowerCase().endsWith(focusedOption.value.toLowerCase()) ||
      choice.toLowerCase().includes(focusedOption.value.toLowerCase())
    ) : choices;

    if (filteredChoices.length > 25) {
      filteredChoices = filteredChoices.slice(0, 25);
    }

    return interaction.respond(
      filteredChoices.map((choice) => ({
        name: choice,
        value: choice,
      }))
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const logger = getLogger();
    const guildId = interaction.guildId;
    const channelId = interaction.channelId;
    const userId = interaction.user.id;
    const objectiveType = interaction?.options?.getString('type');
    const objectiveRarity = interaction?.options?.getString('rarity');
    const objectiveMap = interaction?.options?.getString('map');
    const objectiveTime = interaction?.options?.getString('time');

    if (!guildId || !channelId || !userId || !objectiveType || !objectiveRarity || !objectiveMap || !objectiveTime) {
      logger.error(`Command "addObjective" - Missing some values:
        - Guild ID: ${guildId}
        - Channel ID: ${channelId}
        - User ID: ${userId}
        - Type: ${objectiveType}
        - Rarity: ${objectiveRarity}
        - Map: ${objectiveMap}
        - Time: ${objectiveTime}
      `);

      await interaction.reply({
        content: `Something went wrong, please try again.
If the problem persist, please contact the Bot Developer.`,
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    // Invalid values
    if (
      !TYPES.includes(objectiveType) ||
      !RARITIES.includes(objectiveRarity) ||
      !MAPS.includes(objectiveMap) ||
      !objectiveTime.match(/^\d{1,2}\:\d{1,2}$/gm)
    ) {
      logger.error(`Command "addObjective" - Incorrect value(s):
        - Type: ${objectiveType}
        - Rarity: ${objectiveRarity}
        - Map: ${objectiveMap}
        - Time: ${objectiveTime}
      `);

      await interaction.reply({
        content: `One or multiple value(s) are incorrect, please try again.
If the problem persist, please contact the Bot Developer.`,
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    // Save data
    if (guildId && channelId) {
      const channel = await this.container.client.channels.fetch(channelId);
      const time = getRelativeTime(new Date(), objectiveTime);
      const maintenance = isMaintenanceAdded(time);

      const newObjective = await createObjective({
        guildId,
        channelId,
        userId,
        type: objectiveType,
        rarity: objectiveRarity,
        map: objectiveMap,
        time: time.toDate(),
        maintenanceAdded: maintenance,
      });

      logger.info(`New objective (type: ${newObjective.type}, rarity: ${newObjective.rarity}, map: ${newObjective.map}, time: ${dayjs(newObjective.time).utc().format('DD/MM HH:mm')}) has been created in Discord ${guildId}`);

      await interaction.reply({
        content: `Your objective (${objectiveType}) has been successfully added!
It will be available at ${time.format('HH:mm')} UTC (<t:${time.unix()}:R>) on the map ${objectiveMap}`,
        flags: MessageFlags.Ephemeral,
      });

      // Get all data for this guild and send a new message
      const objectives = await findObjectiveByGuildId(guildId);

      if (objectives.length > 0 && channel) {
        const oldObjectives = objectives.filter((objective) => objective.time.getTime() < new Date().getTime());
        const currentObjectives = objectives.filter((objective) => objective.time.getTime() > new Date().getTime());

        // Delete old objectives
        if (oldObjectives.length > 0) {
          // Delete objectives
          for (const objective of oldObjectives) {
            try {
              await deleteObjective(objective.id);
            } catch (e) {
              logger.error(`Error during the delete of the objective: ${objective};
                Error: ${e}`);
            }
          }
        }

        if (currentObjectives.length > 0) {
          await deletePreviousMessage(this.container.client, channel.id);

          // @ts-ignore
          await channel.send({
            components: getMessage('objective', currentObjectives),
            flags: MessageFlags.IsComponentsV2,
          });
        }
      }

      return;
    }

    await interaction.reply({
      content: 'There is no objectives to display',
      flags: MessageFlags.Ephemeral,
    });
  }
}
