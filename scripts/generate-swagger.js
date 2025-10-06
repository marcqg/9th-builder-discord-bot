#!/usr/bin/env node

import swaggerJsdoc from 'swagger-jsdoc';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Script to generate the swagger.json file without starting the server
 */
function generateSwaggerSpec() {
    const options = {
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'Discord Bot Cluster API',
                version: '1.0.3',
                description: 'API documentation for the Discord Bot Cluster management system',
                contact: {
                    name: 'Guillaume Marcq',
                    email: 'contact@example.com'
                },
                license: {
                    name: 'MIT',
                    url: 'https://opensource.org/licenses/MIT'
                }
            },
            servers: [
                {
                    url: `http://localhost:3001/`,
                    description: 'Development server'
                }
            ],
            components: {
                securitySchemes: {
                    ApiKeyAuth: {
                        type: 'apiKey',
                        in: 'header',
                        name: 'Authorization',
                        description: 'API key for accessing protected endpoints'
                    }
                },
                schemas: {
                    ApiInfo: {
                        type: 'object',
                        properties: {
                            name: {
                                type: 'string',
                                example: 'Discord Bot Cluster API'
                            },
                            author: {
                                type: 'string',
                                example: 'Guillaume Marcq'
                            }
                        }
                    },
                    BuildDeclaration: {
                        type: 'object',
                        required: ['url', 'message', 'filename'],
                        properties: {
                            url: {
                                type: 'string',
                                format: 'uri',
                                description: 'URL of the build artifact',
                                example: 'https://example.com/builds/my-build.zip'
                            },
                            message: {
                                type: 'string',
                                description: 'Build message or description',
                                example: 'New feature implementation'
                            },
                            filename: {
                                type: 'string',
                                description: 'Name of the build file',
                                example: 'my-build-v1.0.0.zip'
                            }
                        }
                    },
                    BuildResponse: {
                        type: 'object',
                        properties: {
                            success: {
                                type: 'boolean',
                                example: true
                            },
                            message: {
                                type: 'string',
                                example: 'Build declared successfully'
                            },
                            data: {
                                type: 'object',
                                properties: {
                                    id: {
                                        type: 'number',
                                        example: 1672531200000
                                    },
                                    url: {
                                        type: 'string',
                                        example: 'https://example.com/builds/my-build.zip'
                                    },
                                    message: {
                                        type: 'string',
                                        example: 'New feature implementation'
                                    },
                                    filename: {
                                        type: 'string',
                                        example: 'my-build-v1.0.0.zip'
                                    },
                                    createdAt: {
                                        type: 'string',
                                        format: 'date-time',
                                        example: '2023-01-01T00:00:00.000Z'
                                    }
                                }
                            }
                        }
                    },
                    GetGuildsResponse: {
                        type: 'object',
                        properties: {
                            guilds: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                },
                                description: 'List of guild IDs',
                                example: ['123456789012345678', '987654321098765432']
                            }
                        }
                    },
                    ShardInfo: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number',
                                description: 'Shard ID',
                                example: 0
                            },
                            ready: {
                                type: 'boolean',
                                description: 'Whether the shard is ready',
                                example: true
                            },
                            error: {
                                type: 'boolean',
                                description: 'Whether the shard has an error',
                                example: false
                            },
                            uptimeSecs: {
                                type: 'number',
                                description: 'Uptime in seconds',
                                example: 3600
                            }
                        }
                    },
                    ShardStats: {
                        type: 'object',
                        properties: {
                            shardCount: {
                                type: 'number',
                                description: 'Total number of shards',
                                example: 2
                            },
                            uptimeSecs: {
                                type: 'number',
                                description: 'Manager uptime in seconds',
                                example: 7200
                            }
                        }
                    },
                    GetShardsResponse: {
                        type: 'object',
                        properties: {
                            shards: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/ShardInfo'
                                }
                            },
                            stats: {
                                $ref: '#/components/schemas/ShardStats'
                            }
                        }
                    },
                    SetShardPresencesRequest: {
                        type: 'object',
                        required: ['type', 'name'],
                        properties: {
                            type: {
                                type: 'string',
                                enum: ['Playing', 'Streaming', 'Listening', 'Watching', 'Custom', 'Competing'],
                                description: 'Activity type',
                                example: 'Playing'
                            },
                            name: {
                                type: 'string',
                                description: 'Activity name',
                                example: 'with Discord.js'
                            },
                            url: {
                                type: 'string',
                                format: 'uri',
                                description: 'Stream URL (only for Streaming type)',
                                example: 'https://twitch.tv/example'
                            }
                        }
                    },
                    ErrorResponse: {
                        type: 'object',
                        properties: {
                            error: {
                                type: 'string',
                                description: 'Error message',
                                example: 'Validation error'
                            }
                        }
                    }
                }
            }
        },
        apis: [join(__dirname, '../src/controllers/*.ts')] // Path to files containing JSDoc annotations
    };

    return swaggerJsdoc(options);
}

async function main() {
    try {
        console.log('🔄 Generating Swagger specification...');
        
        const swaggerSpec = generateSwaggerSpec();
        const outputPath = join(__dirname, '../swagger/v1/swagger.json');
        
        // Write the swagger.json file
        writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2), 'utf8');
        
        console.log(`✅ Swagger specification generated successfully: ${outputPath}`);
        console.log(`📊 Number of documented endpoints: ${Object.keys(swaggerSpec.paths || {}).length}`);
        
        // Display endpoints summary
        if (swaggerSpec.paths) {
            console.log('\n📋 Documented endpoints:');
            Object.entries(swaggerSpec.paths).forEach(([path, methods]) => {
                const methodsList = Object.keys(methods).filter(method => method !== 'parameters').join(', ').toUpperCase();
                console.log(`  ${methodsList} ${path}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error while generating Swagger specification:', error);
        process.exit(1);
    }
}

// Execute the script
main();
