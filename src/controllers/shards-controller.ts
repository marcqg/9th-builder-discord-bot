import { ActivityType, ShardingManager } from 'discord.js';
import { Request, Response, Router } from 'express';
import { createRequire } from 'node:module';

import { Controller } from './index.js';
import { CustomClient } from '../extensions/index.js';
import { mapClass } from '../middleware/index.js';
import {
    GetShardsResponse,
    SetShardPresencesRequest,
    ShardInfo,
    ShardStats,
} from '../models/cluster-api/index.js';
import { Logger } from '../services/index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');

export class ShardsController implements Controller {
    public path = '/shards';
    public router: Router = Router();
    public authToken: string = Config.api.secret;

    constructor(private shardManager: ShardingManager) {}

    public register(): void {
        /**
         * @swagger
         * /shards:
         *   get:
         *     summary: Get shard information
         *     description: Retrieve information about all shards including status and statistics
         *     tags: [Shards]
         *     security:
         *       - ApiKeyAuth: []
         *     responses:
         *       200:
         *         description: Shard information and statistics
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/GetShardsResponse'
         *       401:
         *         description: Unauthorized
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         */
        this.router.get('/', (req, res) => this.getShards(req, res));

        /**
         * @swagger
         * /shards/presence:
         *   put:
         *     summary: Set shard presences
         *     description: Update the presence/activity status of all shards
         *     tags: [Shards]
         *     security:
         *       - ApiKeyAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/SetShardPresencesRequest'
         *     responses:
         *       200:
         *         description: Presence updated successfully
         *       400:
         *         description: Validation error
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         *       401:
         *         description: Unauthorized
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         */
        this.router.put('/presence', mapClass(SetShardPresencesRequest), (req, res) =>
            this.setShardPresences(req, res)
        );
    }

    private async getShards(req: Request, res: Response): Promise<void> {
        let shardDatas = await Promise.all(
            this.shardManager.shards.map(async shard => {
                let shardInfo: ShardInfo = {
                    id: shard.id,
                    ready: shard.ready,
                    error: false,
                };

                try {
                    let uptime = (await shard.fetchClientValue('uptime')) as number;
                    shardInfo.uptimeSecs = Math.floor(uptime / 1000);
                } catch (error) {
                    Logger.error(Logs.error.managerShardInfo, error);
                    shardInfo.error = true;
                }

                return shardInfo;
            })
        );

        let stats: ShardStats = {
            shardCount: this.shardManager.shards.size,
            uptimeSecs: Math.floor(process.uptime()),
        };

        let resBody: GetShardsResponse = {
            shards: shardDatas,
            stats,
        };
        res.status(200).json(resBody);
    }

    private async setShardPresences(req: Request, res: Response): Promise<void> {
        let reqBody: SetShardPresencesRequest = res.locals.input;

        await this.shardManager.broadcastEval(
            (client, context) => {
                let customClient = client as CustomClient;
                return customClient.setPresence(context.type, context.name, context.url);
            },
            { context: { type: ActivityType[reqBody.type], name: reqBody.name, url: reqBody.url } }
        );

        res.sendStatus(200);
    }
}
