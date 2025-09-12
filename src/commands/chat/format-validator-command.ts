import { ChatInputCommandInteraction, PermissionsString } from 'discord.js';

import { FormatValidatorCommandName } from '../../enums/index.js';
import { FormatValidationStore } from '../../models/format-validator.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

export class FormatValidatorCommand implements Command {
    public names = [Lang.getRef('chatCommands.formatValidator', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = ['SendMessages'];

    public async execute(intr: ChatInputCommandInteraction, _data: EventData): Promise<void> {
        // Only allow usage in guild channels
        if (!intr.guild || !intr.channel) {
            await InteractionUtils.send(
                intr,
                'This command can only be used in server channels.'
            );
            return;
        }

        // Check if user has manage channels permission
        const member = await intr.guild.members.fetch(intr.user.id);
        if (!member.permissions.has('ManageChannels')) {
            await InteractionUtils.send(
                intr,
                'You need the "Manage Channels" permission to use this command.'
            );
            return;
        }

        // Command option
        let args = {
            command: intr.options.getString(Lang.getRef('arguments.command', Language.Default)) as
                | FormatValidatorCommandName
                | undefined,
            pattern: intr.options.getString('pattern'),
            errorMessage: intr.options.getString('error_message'),
        };

        if (!args.command) {
            await InteractionUtils.send(intr, 'Please specify a valid subcommand.');
            return;
        }

        const guildId = intr.guild.id;
        const channelId = intr.channel.id;

        switch (args.command) {
            case FormatValidatorCommandName.ENABLE: {
                // Pattern and error message are required for ENABLE
                if (!args.pattern) {
                    await InteractionUtils.send(
                        intr,
                        'You must provide a regex pattern for message validation.'
                    );
                    return;
                }

                if (!args.errorMessage) {
                    await InteractionUtils.send(
                        intr,
                        'You must provide an error message to display when messages don\'t match the pattern.'
                    );
                    return;
                }

                try {
                    // Test if the pattern is valid
                    new RegExp(args.pattern);
                } catch (error) {
                    await InteractionUtils.send(
                        intr,
                        `Invalid regex pattern: ${error.message}`
                    );
                    return;
                }

                // Set the rule
                FormatValidationStore.setRule(
                    guildId,
                    channelId,
                    args.pattern,
                    args.errorMessage
                );

                await InteractionUtils.send(
                    intr,
                    `✅ Message format validation enabled for this channel.\n` +
                        `Pattern: \`${args.pattern}\`\n` +
                        `Error message: ${args.errorMessage}`
                );
                break;
            }
            case FormatValidatorCommandName.DISABLE: {
                const disabled = FormatValidationStore.disableRule(guildId, channelId);

                if (disabled) {
                    await InteractionUtils.send(
                        intr,
                        '✅ Message format validation disabled for this channel.'
                    );
                } else {
                    await InteractionUtils.send(
                        intr,
                        'ℹ️ Message format validation was not enabled for this channel.'
                    );
                }
                break;
            }
            case FormatValidatorCommandName.STATUS: {
                const rule = FormatValidationStore.getRule(guildId, channelId);

                if (rule && rule.enabled) {
                    await InteractionUtils.send(
                        intr,
                        `✅ Message format validation is **enabled** for this channel.\n` +
                            `Pattern: \`${rule.pattern}\`\n` +
                            `Error message: ${rule.errorMessage}`
                    );
                } else {
                    await InteractionUtils.send(
                        intr,
                        'ℹ️ Message format validation is **not enabled** for this channel.'
                    );
                }
                break;
            }
            default: {
                await InteractionUtils.send(intr, 'Invalid command option.');
                break;
            }
        }
    }
}

// Import here to avoid circular dependency
import { Language } from '../../models/enum-helpers/index.js';
