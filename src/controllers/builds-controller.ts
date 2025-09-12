import { Request, Response, Router } from 'express';

import { Controller } from './index.js';

export interface BuildDeclaration {
    url: string;
    message: string;
    filename: string;
}

export class BuildsController implements Controller {
    public path = '/builds';
    public router: Router = Router();

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

            // Ici vous pouvez ajouter la logique pour traiter la déclaration du build
            // Par exemple : sauvegarder en base de données, envoyer une notification, etc.
            
            // Pour l'instant, on retourne simplement les données reçues
            const buildData = {
                id: Date.now(), // ID temporaire basé sur le timestamp
                url: url.trim(),
                message: message.trim(),
                filename: filename.trim(),
                createdAt: new Date().toISOString()
            };

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
}
