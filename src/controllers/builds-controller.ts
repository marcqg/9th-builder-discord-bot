import { EmbedBuilder, ShardingManager } from 'discord.js';
import { Request, Response, Router } from 'express';
import { createRequire } from 'node:module';

import { Controller } from './index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

export interface BuildDeclaration {
    url: string;
    message: string;
    filename: string;
}

export class BuildsController implements Controller {
    public path = '/builds';
    public router: Router = Router();

    constructor(private shardManager?: ShardingManager) {}

    public register(): void {
        /**
         * @swagger
         * /builds:
         *   post:
         *     summary: Declare a new build
         *     description: Declare a new build with URL, message, and filename
         *     tags: [Builds]
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

            // Validation des paramètres requis
            if (!url || typeof url !== 'string') {
                res.status(400).json({ 
                    error: 'Le paramètre "url" est requis et doit être une chaîne de caractères' 
                });
                return;
            }

            if (!message || typeof message !== 'string') {
                res.status(400).json({ 
                    error: 'Le paramètre "message" est requis et doit être une chaîne de caractères' 
                });
                return;
            }

            if (!filename || typeof filename !== 'string') {
                res.status(400).json({ 
                    error: 'Le paramètre "filename" est requis et doit être une chaîne de caractères' 
                });
                return;
            }

            // Validation basique de l'URL
            try {
                new URL(url);
            } catch {
                res.status(400).json({ 
                    error: 'Le paramètre "url" doit être une URL valide' 
                });
                return;
            }

            // Créer les données du build
            const buildData = {
                id: Date.now(), // ID temporaire basé sur le timestamp
                url: url.trim(),
                message: message.trim(),
                filename: filename.trim(),
                createdAt: new Date().toISOString()
            };

            // Envoyer la notification Discord si configurée
            if (Config.notifications?.builds?.enabled && this.shardManager) {
                try {
                    await this.sendDiscordNotification(buildData);
                } catch (error) {
                    console.error('Erreur lors de l\'envoi de la notification Discord:', error);
                    // Ne pas faire échouer la requête si la notification échoue
                }
            }

            res.status(201).json({
                success: true,
                message: 'Build déclaré avec succès',
                data: buildData
            });

        } catch {
            res.status(500).json({
                error: 'Erreur interne du serveur lors de la déclaration du build'
            });
        }
    }

    private async sendDiscordNotification(buildData: any): Promise<void> {
        if (!this.shardManager || !Config.notifications?.builds?.channelIds) {
            return;
        }

        const channelIds = Config.notifications.builds.channelIds as string[];
        
        // Créer un embed Discord pour la notification
        const embed = new EmbedBuilder()
            .setTitle('🔨 New Build Available')
            .setDescription(buildData.message)
            .setColor(0x00FF00) // Vert pour succès
            .addFields([
                {
                    name: '📄 File',
                    value: buildData.filename,
                    inline: true
                },
                {
                    name: '🔗 URL',
                    value: `[Télécharger](${buildData.url})`,
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

        // Envoyer le message via le shardManager
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
