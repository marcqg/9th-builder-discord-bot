import { ShardingManager } from 'discord.js';
import { createRequire } from 'node:module';
import 'reflect-metadata';

import { BuildsController, GuildsController, RootController, ShardsController, SwaggerController } from './controllers/index.js';
import { Job, UpdateServerCountJob } from './jobs/index.js';
import { Api } from './models/api.js';
import { Manager } from './models/manager.js';
import { HttpService, JobService, Logger, MasterApiService } from './services/index.js';
import { MathUtils, ShardUtils } from './utils/index.js';

const require = createRequire(import.meta.url);
let Config = require('../config/config.json');
let Debug = require('../config/debug.json');
let Logs = require('../lang/logs.json');

async function start(): Promise<void> {
    Logger.info(Logs.info.appStarted);

    // Dependencies
    let httpService = new HttpService();
    let masterApiService = new MasterApiService(httpService);
    if (Config.clustering.enabled) {
        await masterApiService.register();
    }

    // Sharding
    let shardList: number[];
    let totalShards: number;
    try {
        if (Config.clustering.enabled) {
            let resBody = await masterApiService.login();
            shardList = resBody.shardList;
            let requiredShards = await ShardUtils.requiredShardCount(Config.client.token);
            totalShards = Math.max(requiredShards, resBody.totalShards);
        } else {
            let recommendedShards = await ShardUtils.recommendedShardCount(
                Config.client.token,
                Config.sharding.serversPerShard
            );
            shardList = MathUtils.range(0, recommendedShards);
            totalShards = recommendedShards;
        }
    } catch (error) {
        Logger.error(Logs.error.retrieveShards, error);
        return;
    }

    if (shardList.length === 0) {
        Logger.warn(Logs.warn.managerNoShards);
        return;
    }

    let shardManager = new ShardingManager('dist/start-bot.js', {
        token: Config.client.token,
        mode: Debug.override.shardMode.enabled ? Debug.override.shardMode.value : 'process',
        respawn: true,
        totalShards,
        shardList,
    });

    shardManager.on('shardCreate', async (shard) => {
        Logger.info(`✅ Shard ${shard.id} créé`);

        shard.on('error', error => {
            Logger.error(`❌ Erreur Shard ${shard.id}:`, error);
        });

        shard.on('death', () => {
            Logger.warn(`⚠️ Shard ${shard.id} mort`);
        });
    })

    // Jobs
    let jobs: Job[] = [
        Config.clustering.enabled ? undefined : new UpdateServerCountJob(shardManager, httpService),
        // TODO: Add new jobs here
    ].filter(Boolean);

    const manager = new Manager(shardManager, new JobService(jobs));

    // API
    const buildsController = new BuildsController(shardManager);
    const guildsController = new GuildsController(shardManager);
    const shardsController = new ShardsController(shardManager);
    const rootController = new RootController();
    const swaggerController = new SwaggerController();
    const api = new Api([buildsController, guildsController, shardsController, rootController, swaggerController]);

    // Start
    await manager.start();
    await api.start();
    if (Config.clustering.enabled) {
        await masterApiService.ready();
    }
}

process.on('unhandledRejection', (reason, _promise) => {
    Logger.error(Logs.error.unhandledRejection, reason);
});

start().catch(error => {
    Logger.error(Logs.error.unspecified, error);
});
