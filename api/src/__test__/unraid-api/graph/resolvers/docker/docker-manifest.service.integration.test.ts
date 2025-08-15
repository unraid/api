import { beforeAll, describe, expect, it, vi } from 'vitest';

import { DockerAuthService } from '@app/unraid-api/graph/resolvers/docker/docker-auth.service.js';
import { DockerManifestService } from '@app/unraid-api/graph/resolvers/docker/docker-manifest.service.js';

describe('DockerManifestService - Integration Tests', () => {
    let service: DockerManifestService;
    let dockerAuthService: DockerAuthService;

    beforeAll(() => {
        dockerAuthService = new DockerAuthService();
        service = new DockerManifestService(dockerAuthService);
    }, 30000);

    describe('headManifest - Real HTTP calls', () => {
        it('should receive authentication challenge from Docker Hub', async () => {
            const manifestURL = 'https://registry-1.docker.io/v2/library/alpine/manifests/latest';
            const headers = {
                Accept: 'application/vnd.docker.distribution.manifest.list.v2+json,application/vnd.docker.distribution.manifest.v2+json,application/vnd.oci.image.index.v1+json',
            };

            const result = await service.headManifest(manifestURL, headers);

            expect(result.statusCode).toBe(401);
            expect(result.headers['www-authenticate']).toContain('Bearer');
            expect(result.headers['www-authenticate']).toContain('realm');
        }, 15000);

        it('should handle unauthorized requests gracefully', async () => {
            const manifestURL = 'https://registry-1.docker.io/v2/library/hello-world/manifests/latest';
            const headers = {
                Accept: 'application/vnd.docker.distribution.manifest.v2+json',
            };

            const result = await service.headManifest(manifestURL, headers);

            expect(result.statusCode).toBeGreaterThanOrEqual(200);
            expect(result.statusCode).toBeLessThan(500);
        }, 15000);
    });

    describe('getRemoteDigest - Real Docker Registry calls', () => {
        it('should get digest for public Alpine image', async () => {
            const digest = await service.getRemoteDigest('alpine:latest');

            expect(digest).toMatch(/^sha256:[a-f0-9]{64}$/);
        }, 30000);

        it('should get digest for public Nginx image', async () => {
            const digest = await service.getRemoteDigest('nginx:latest');

            expect(digest).toMatch(/^sha256:[a-f0-9]{64}$/);
        }, 30000);

        it('should get digest for specific image tag', async () => {
            const digest = await service.getRemoteDigest('alpine:3.18');

            expect(digest).toMatch(/^sha256:[a-f0-9]{64}$/);
        }, 30000);

        it('should handle non-existent image gracefully', async () => {
            const digest = await service.getRemoteDigest('nonexistent/nonexistent:nonexistent');

            expect(digest).toBeNull();
        }, 30000);

        it('should work with Docker Hub organization images', async () => {
            const digest = await service.getRemoteDigest('library/hello-world:latest');

            expect(digest).toMatch(/^sha256:[a-f0-9]{64}$/);
        }, 30000);

        it('should handle anonymous access to public registries', async () => {
            const digest = await service.getRemoteDigest('busybox:latest');

            expect(digest).toMatch(/^sha256:[a-f0-9]{64}$/);
        }, 30000);

        it('should work with images without explicit tags', async () => {
            const digest = await service.getRemoteDigest('ubuntu');

            expect(digest).toMatch(/^sha256:[a-f0-9]{64}$/);
        }, 30000);

        it('should get digest with mocked empty docker auth', async () => {
            const mockDockerAuthService = new DockerAuthService();
            const mockManifestService = new DockerManifestService(mockDockerAuthService);

            vi.spyOn(mockDockerAuthService, 'readDockerAuth').mockResolvedValue({});

            const digest = await mockManifestService.getRemoteDigest('alpine:latest');

            expect(digest).toMatch(/^sha256:[a-f0-9]{64}$/);
        }, 30000);

        it('should investigate HEAD vs GET behavior with authentication', async () => {
            const manifestURL = 'https://registry-1.docker.io/v2/library/alpine/manifests/latest';
            const headers = { Accept: 'application/vnd.docker.distribution.manifest.v2+json' };

            // Test initial HEAD request (should be 401)
            const initialResult = await service.headManifest(manifestURL, headers);
            // console.log('Initial HEAD request - Status:', initialResult.statusCode);

            // Get Bearer token for anonymous access
            const wwwAuth = (initialResult.headers?.['www-authenticate'] || '').toString();
            const token = await dockerAuthService.getBearerToken(wwwAuth, {
                username: '',
                password: '',
            });
            // console.log('Got token:', !!token);

            if (token) {
                // Test authenticated HEAD request
                const authResult = await service.headManifest(manifestURL, headers, {
                    Authorization: `Bearer ${token}`,
                });
                // console.log('Authenticated HEAD request - Status:', authResult.statusCode);
                // console.log('Authenticated HEAD digest:', authResult.headers?.['docker-content-digest']);

                expect(authResult.statusCode).toBeGreaterThanOrEqual(200);
                expect(authResult.statusCode).toBeLessThan(300);
            }
        }, 30000);

        it('should handle moderate concurrent requests', async () => {
            // Start with fewer requests to identify the breaking point
            const promises = Array.from({ length: 10 }, () => service.getRemoteDigest('alpine:latest'));

            const results = await Promise.all(promises);

            results.forEach((digest, index) => {
                expect(digest, `Request ${index + 1} failed`).toMatch(/^sha256:[a-f0-9]{64}$/);
            });
        }, 60000);

        it('should handle 100 requests with optimized batching', async () => {
            const batchSize = 10;
            const totalRequests = 100;
            const results: (string | null)[] = [];

            // Process in batches with minimal delays
            for (let i = 0; i < totalRequests; i += batchSize) {
                const batch = Array.from({ length: Math.min(batchSize, totalRequests - i) }, () =>
                    service.getRemoteDigest('alpine:latest')
                );

                const batchResults = await Promise.all(batch);
                results.push(...batchResults);

                // Minimal delay between batches
                if (i + batchSize < totalRequests) {
                    await new Promise((resolve) => setTimeout(resolve, 50));
                }
            }

            expect(results).toHaveLength(totalRequests);
            results.forEach((digest, index) => {
                expect(digest, `Request ${index + 1} failed`).toMatch(/^sha256:[a-f0-9]{64}$/);
            });
        }, 60000);
    });
});
