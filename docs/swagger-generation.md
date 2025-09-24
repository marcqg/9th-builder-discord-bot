# Swagger.json File Generation

This project includes a script to generate the `swagger.json` file without needing to start the server.

## Usage

### Via npm script (recommended)
```bash
npm run swagger:generate
```

### Directly
```bash
node scripts/generate-swagger.js
```

## How it works

The `scripts/generate-swagger.js` script:

1. **Automatically analyzes** all controller files in `src/controllers/*.ts`
2. **Extracts Swagger JSDoc annotations** from `@swagger` comments
3. **Generates the complete OpenAPI 3.0 specification**
4. **Saves** the `swagger.json` file at the project root

## Output

The script will display:
- ✅ Successful generation confirmation
- 📊 Number of documented endpoints
- 📋 Detailed list of found endpoints

Example output:
```
🔄 Generating Swagger specification...
✅ Swagger specification generated successfully: /path/to/project/swagger.json
📊 Number of documented endpoints: 5

📋 Documented endpoints:
  POST /builds
  GET /guilds
  GET /
  GET /shards
  PUT /shards/presence
```

## Benefits

- **No server needed**: Offline generation
- **CI/CD integration**: Can be used in pipelines
- **Development**: Quick generation for testing documentation
- **Deployment**: File generation for static environments

## Endpoint documentation

To add new endpoints to the documentation, use Swagger JSDoc annotations in your controllers:

```typescript
/**
 * @swagger
 * /my-endpoint:
 *   get:
 *     summary: Short description
 *     description: Detailed description
 *     tags: [MyTag]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MySchema'
 */
router.get('/my-endpoint', (req, res) => this.handleRequest(req, res));
```

## Generated file

The generated `swagger.json` file:
- Is **OpenAPI 3.0** compatible
- Includes all defined **schemas**
- Contains **security** (ApiKeyAuth)
- Is ready for **Swagger UI** or other tools

## Notes

- The script requires **no additional dependencies** (uses already installed packages)
- Controller modifications are **automatically reflected** on next generation
- The generated file can be **versioned** or ignored according to your preferences (see `.gitignore`)
