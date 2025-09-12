import { Message, TextChannel } from 'discord.js';

import { FormatValidationStore } from '../models/format-validator.js';
import { EventData } from '../models/internal-models.js';
import { Trigger } from './trigger.js';

export class FormatValidatorTrigger implements Trigger {
    public requireGuild = true;

    constructor() {}

    public triggered(msg: Message): boolean {
        // Only validate messages in guilds with active rules
        if (!msg.guild) return false;

        // Check if there's an active rule for this channel
        const activeRules = FormatValidationStore.getActiveRules();
        return activeRules.some(rule => 
            rule.guildId === msg.guild?.id && 
            rule.channelId === msg.channel.id
        );
    }

    public async execute(msg: Message, data: EventData): Promise<void> {
        if (!msg.guild) return;

        // Find the matching rule for this channel
        const rule = FormatValidationStore.getRule(msg.guild.id, msg.channel.id);
        
        if (!rule || !rule.enabled) {
            return; // This shouldn't happen due to the triggered check, but just to be safe
        }

        // Create RegExp from pattern
        const regex = new RegExp(rule.pattern);

        // Test if message matches the required format
        if (!regex.test(msg.content)) {
            // Message doesn't match the format - notify the user
            try {
                const channel = msg.channel as TextChannel;
                const notification = await channel.send({
                    content: `<@${msg.author.id}>, ${rule.errorMessage}`,
                });
                
                // Delete the notification after a delay (30 seconds)
                setTimeout(() => {
                    notification.delete().catch(() => {
                        // Ignore errors if notification was already deleted
                    });
                }, 30000);
            } catch (error) {
                console.error('Error handling incorrect message format:', error);
            }
        }
    }
}
