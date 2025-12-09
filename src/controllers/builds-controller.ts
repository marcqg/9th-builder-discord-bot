import { EmbedBuilder, ShardingManager } from 'discord.js';
import { Request, Response, Router } from 'express';
import { createRequire } from 'node:module';

import { Controller } from './index.js';
import { Logger } from '../services';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');

export interface BuildDeclaration {
    url: string;
    message: string;
    filename: string;
}

export class BuildsController implements Controller {
    public path = '/builds';
    public router: Router = Router();
    public authToken: string = Config.api.secret;

    constructor(private shardManager: ShardingManager) {}

    public register(): void {
        /**
         * @swagger
         * /builds:
         *   post:
         *     summary: Declare a new build
         *     description: Declare a new build with URL, message, and filename
         *     tags: [Builds]
         *     security:
         *       - ApiKeyAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/BuildDeclaration'
         *     responses:
         *       201:
         *         description: Build declared successfully
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/BuildResponse'
         *       400:
         *         description: Validation error
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         *       500:
         *         description: Internal server error
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         */
        this.router.post('/', (req, res) => this.declareBuild(req, res));
    }

    private async declareBuild(req: Request, res: Response): Promise<void> {
        try {
            const { url, message, filename }: BuildDeclaration = req.body;

            // Required parameters validation
            if (!url || typeof url !== 'string') {
                res.status(400).json({ 
                    error: 'The "url" parameter is required and must be a string'
                });
                return;
            }

            if (!message || typeof message !== 'string') {
                res.status(400).json({ 
                    error: 'The "message" parameter is required and must be a string'
                });
                return;
            }

            if (!filename || typeof filename !== 'string') {
                res.status(400).json({ 
                    error: 'The "filename" parameter is required and must be a string'
                });
                return;
            }

            // Basic URL validation
            try {
                new URL(url);
            } catch {
                res.status(400).json({ 
                    error: 'The "url" parameter must be a valid URL'
                });
                return;
            }

            // Create build data
            const buildData = {
                id: Date.now(), // Temporary ID based on timestamp
                url: url.trim(),
                message: message.trim(),
                filename: filename.trim(),
                createdAt: new Date().toISOString()
            };

            // Send Discord notification if configured
            if (Config.notifications.builds.enabled) {
                if (!Config.notifications.builds.channelIds) {
                    Logger.error(Logs.error.buildNotificationNoChannelIds);
                    res.status(503).json({
                        error: Logs.error.buildNotificationNoChannelIds,
                    });
                    return;
                }

                try {
                    await this.sendDiscordNotification(buildData);
                } catch (error) {
                    console.error('Error sending Discord notification:', error);
                    // Don't fail the request if notification fails
                }
            }
            else {
                Logger.error(Logs.error.buildNotificationDisabled)
                res.status(503).json({
                    error: Logs.error.buildNotificationDisabled,
                });
                return;
            }

            res.status(201).json({
                success: true,
                message: 'Build declared successfully',
                data: buildData
            });

        } catch {
            res.status(500).json({
                error: 'Internal server error while declaring build'
            });
        }
    }

    private async sendDiscordNotification(buildData: any): Promise<void> {
        const channelIds = Config.notifications.builds.channelIds as string[];

        // Create Discord embed for notification
        const embed = new EmbedBuilder()
            .setTitle('🔨 New Build Available')
            .setDescription(buildData.message)
            .setColor(0x00FF00) // Green for success
            .addFields([
                {
                    name: '📄 File',
                    value: buildData.filename,
                    inline: true
                },
                {
                    name: '🔗 URL',
                    value: `[Download](${buildData.url})`,
                    inline: true
                },
                {
                    name: '⏰ Created at',
                    value: `<t:${Math.floor(new Date(buildData.createdAt).getTime() / 1000)}:F>`,
                    inline: false
                }
            ])
            .setTimestamp()
            .setFooter({ text: 'Build Notification System' });

        // Send message via shardManager
        for(const channelId of channelIds) {
            await this.shardManager.broadcastEval(
                (client, { channelId, embedData }) => {
                    const channel = client.channels.cache.get(channelId);
                    if (channel && channel.isTextBased()) {
                        return (channel as any).send({ embeds: [embedData] });
                    }
                    return null;
                },
                { context: { channelId, embedData: embed.toJSON() } }
            );
        }
    }
}
