// Test simple pour vérifier Swagger sans dépendances Discord
import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app = express();
app.use(express.json());

// Configuration Swagger simplifiée pour le test
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Discord Bot Cluster API',
            version: '1.0.0',
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
                url: 'http://localhost:3001',
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
    apis: ['./tests/test-swagger.js'] // Ce fichier même contient les annotations
};

const specs = swaggerJsdoc(swaggerOptions);

// Routes de test
/**
 * @swagger
 * /:
 *   get:
 *     summary: Get API information
 *     description: Returns basic information about the API
 *     tags: [General]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiInfo'
 */
app.get('/', (req, res) => {
    res.json({ name: 'Discord Bot Cluster API', author: 'Guillaume Marcq' });
});

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
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.post('/builds', (req, res) => {
    const { url, message, filename } = req.body;
    
    if (!url || !message || !filename) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    res.status(201).json({
        success: true,
        message: 'Build déclaré avec succès',
        data: {
            id: Date.now(),
            url,
            message,
            filename,
            createdAt: new Date().toISOString()
        }
    });
});

// Configuration Swagger UI
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Discord Bot Cluster API Documentation'
}));

// Endpoint pour récupérer le JSON Swagger
app.get('/api-docs/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`✅ Test server started on http://localhost:${PORT}`);
    console.log(`📚 Swagger documentation available at http://localhost:${PORT}/api-docs`);
    console.log(`📄 Swagger JSON available at http://localhost:${PORT}/api-docs/swagger.json`);
    console.log('\nPress Ctrl+C to stop the server');
});
