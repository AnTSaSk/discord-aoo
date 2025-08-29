import { Command } from '@sapphire/framework';
import {
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  PermissionsBitField,
} from 'discord.js';

// Config
import { getLogger } from '@/config/logger.js';

// Services
import { deleteObjective, findObjectiveByGuildId } from '@/services/objective.service.js';

// Tasks
// import { getRelativeTime } from '@/tasks/date.js';
import { deletePreviousMessage, getMessage } from '@/tasks/message.js';

export class RemoveObjectiveCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'remove',
      description: 'Remove an objective from the list',
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
        .addStringOption((option) =>
          option.setName('index')
            .setDescription('Write the index number display as #[INDEX] from the objective line')
            .setRequired(true)
        ),
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const logger = getLogger();
    const guildId = interaction.guildId;
    const channelId = interaction.channelId;
    const objectiveIndex = interaction?.options?.getString('index')?.replace(/\D/g, '');

    if (!guildId || !objectiveIndex) {
      logger.error(`Command 'removeObjectives' - Missing some values:
        - Guild ID: ${guildId}
        - Objective index: ${objectiveIndex}
      `);

      await interaction.reply({
        content: 'Something went wrong, please try again.',
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    // Get data
    if (guildId && channelId) {
      const channel = await this.container.client.channels.fetch(channelId);

      // Get all data for this guild and send a new message
      let objectives = await findObjectiveByGuildId(guildId);

      if (!objectives || parseInt(objectiveIndex) > objectives.length) {
        await interaction.reply({
          content: 'We cannot find the objective you want to remove',
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      if (objectives.length > 0 && interaction.channel) {
        const objective = objectives.find((_item, index) => (index + 1) === parseInt(objectiveIndex));

        if (!objective) {
          await interaction.reply({
            content: 'We cannot find the objective you want to remove',
            flags: MessageFlags.Ephemeral,
          });

          return;
        }

        // @FIXME: Check and rework condition to avoid user removing other's objectives
        if (
          // @ts-ignore
          !channel?.permissionsFor(interaction.user.id).has(PermissionsBitField.Flags.Administrator) ||
          // @ts-ignore
          !channel?.permissionsFor(interaction.user.id).has(PermissionsBitField.Flags.ManageMessages) ||
          interaction.user.id !== objective.userId
        ) {
          await interaction.reply({
            content: 'You don\'t have permission to remove this objective!',
            flags: MessageFlags.Ephemeral
          });

          return;
        }

        await deleteObjective(objective.id);

        if (channel) {
          await deletePreviousMessage(this.container.client, channel.id);

          await interaction.reply({
            content: 'The objective has been removed successfully',
            flags: MessageFlags.Ephemeral
          });

          // @ts-ignore
          await channel.send({
            components: getMessage('objective', objectives),
            flags: MessageFlags.IsComponentsV2,
          });
        }

        return;
      }
    }

    await interaction.reply({
      content: 'No objective to remove',
      flags: MessageFlags.Ephemeral
    });
  }
}
