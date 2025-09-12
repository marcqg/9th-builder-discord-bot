import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Request, Response } from 'express';

import { BuildsController } from '../../src/controllers/builds-controller.js';

// Mock helpers
const createMockRequest = (body: any = {}): Partial<Request> => ({
    body,
});

const createMockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    };
    return res;
};

describe('BuildsController', () => {
    let buildsController: BuildsController;
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
        buildsController = new BuildsController();
        mockReq = createMockRequest();
        mockRes = createMockResponse();
    });

    describe('constructor', () => {
        it('should initialize with correct path', () => {
            expect(buildsController.path).toBe('/builds');
        });

        it('should have a router instance', () => {
            expect(buildsController.router).toBeDefined();
        });
    });

    describe('register', () => {
        it('should register POST route', () => {
            const postSpy = vi.spyOn(buildsController.router, 'post');
            buildsController.register();
            expect(postSpy).toHaveBeenCalledWith('/', expect.any(Function));
        });
    });

    describe('declareBuild - Success Cases', () => {
        it('should successfully declare a build with valid data', async () => {
            const validBody = {
                url: 'https://example.com/build.zip',
                message: 'Test build message',
                filename: 'test-build.zip'
            };

            mockReq.body = validBody;

            // Access the private method through reflection
            await (buildsController as any).declareBuild(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Build déclaré avec succès',
                data: expect.objectContaining({
                    id: expect.any(Number),
                    url: validBody.url,
                    message: validBody.message,
                    filename: validBody.filename,
                    createdAt: expect.any(String)
                })
            });
        });

        it('should trim whitespace from parameters', async () => {
            const bodyWithWhitespace = {
                url: '  https://example.com/build.zip  ',
                message: '  Test build message  ',
                filename: '  test-build.zip  '
            };

            mockReq.body = bodyWithWhitespace;

            await (buildsController as any).declareBuild(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Build déclaré avec succès',
                data: expect.objectContaining({
                    url: 'https://example.com/build.zip',
                    message: 'Test build message',
                    filename: 'test-build.zip'
                })
            });
        });
    });

    describe('declareBuild - Validation Errors', () => {
        it('should return 400 when url is missing', async () => {
            mockReq.body = {
                message: 'Test message',
                filename: 'test.zip'
            };

            await (buildsController as any).declareBuild(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Le paramètre "url" est requis et doit être une chaîne de caractères'
            });
        });

        it('should return 400 when message is missing', async () => {
            mockReq.body = {
                url: 'https://example.com/build.zip',
                filename: 'test.zip'
            };

            await (buildsController as any).declareBuild(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Le paramètre "message" est requis et doit être une chaîne de caractères'
            });
        });

        it('should return 400 when filename is missing', async () => {
            mockReq.body = {
                url: 'https://example.com/build.zip',
                message: 'Test message'
            };

            await (buildsController as any).declareBuild(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Le paramètre "filename" est requis et doit être une chaîne de caractères'
            });
        });

        it('should return 400 when url is not a string', async () => {
            mockReq.body = {
                url: 123,
                message: 'Test message',
                filename: 'test.zip'
            };

            await (buildsController as any).declareBuild(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Le paramètre "url" est requis et doit être une chaîne de caractères'
            });
        });

        it('should return 400 when message is not a string', async () => {
            mockReq.body = {
                url: 'https://example.com/build.zip',
                message: 123,
                filename: 'test.zip'
            };

            await (buildsController as any).declareBuild(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Le paramètre "message" est requis et doit être une chaîne de caractères'
            });
        });

        it('should return 400 when filename is not a string', async () => {
            mockReq.body = {
                url: 'https://example.com/build.zip',
                message: 'Test message',
                filename: 123
            };

            await (buildsController as any).declareBuild(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Le paramètre "filename" est requis et doit être une chaîne de caractères'
            });
        });

        it('should return 400 when url is invalid', async () => {
            mockReq.body = {
                url: 'invalid-url',
                message: 'Test message',
                filename: 'test.zip'
            };

            await (buildsController as any).declareBuild(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Le paramètre "url" doit être une URL valide'
            });
        });

        it('should return 400 when url is empty string', async () => {
            mockReq.body = {
                url: '',
                message: 'Test message',
                filename: 'test.zip'
            };

            await (buildsController as any).declareBuild(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Le paramètre "url" est requis et doit être une chaîne de caractères'
            });
        });

        it('should return 400 when message is empty string', async () => {
            mockReq.body = {
                url: 'https://example.com/build.zip',
                message: '',
                filename: 'test.zip'
            };

            await (buildsController as any).declareBuild(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Le paramètre "message" est requis et doit être une chaîne de caractères'
            });
        });

        it('should return 400 when filename is empty string', async () => {
            mockReq.body = {
                url: 'https://example.com/build.zip',
                message: 'Test message',
                filename: ''
            };

            await (buildsController as any).declareBuild(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Le paramètre "filename" est requis et doit être une chaîne de caractères'
            });
        });
    });

    describe('declareBuild - URL Validation', () => {
        it('should accept valid HTTP URLs', async () => {
            mockReq.body = {
                url: 'http://example.com/build.zip',
                message: 'Test message',
                filename: 'test.zip'
            };

            await (buildsController as any).declareBuild(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
        });

        it('should accept valid HTTPS URLs', async () => {
            mockReq.body = {
                url: 'https://example.com/build.zip',
                message: 'Test message',
                filename: 'test.zip'
            };

            await (buildsController as any).declareBuild(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
        });

        it('should accept URLs with ports', async () => {
            mockReq.body = {
                url: 'https://example.com:8080/build.zip',
                message: 'Test message',
                filename: 'test.zip'
            };

            await (buildsController as any).declareBuild(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
        });

        it('should accept URLs with paths and query parameters', async () => {
            mockReq.body = {
                url: 'https://example.com/path/to/build.zip?version=1.0.0&token=abc123',
                message: 'Test message',
                filename: 'test.zip'
            };

            await (buildsController as any).declareBuild(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
        });
    });

    describe('declareBuild - Error Handling', () => {
        it('should handle unexpected errors and return 500', async () => {
            // Mock Date.now to throw an error after URL validation passes
            const originalDateNow = Date.now;
            Date.now = vi.fn().mockImplementation(() => {
                throw new Error('Unexpected error');
            });

            mockReq.body = {
                url: 'https://example.com/build.zip',
                message: 'Test message',
                filename: 'test.zip'
            };

            await (buildsController as any).declareBuild(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Erreur interne du serveur lors de la déclaration du build'
            });

            // Restore original Date.now
            Date.now = originalDateNow;
        });

        it('should return 400 when URL constructor throws (invalid URL)', async () => {
            // This test verifies that URL validation errors are handled properly
            mockReq.body = {
                url: 'not-a-valid-url',
                message: 'Test message',
                filename: 'test.zip'
            };

            await (buildsController as any).declareBuild(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Le paramètre "url" doit être une URL valide'
            });
        });
    });
});
