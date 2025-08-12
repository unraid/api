import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { DockerAuthService } from '@app/unraid-api/graph/resolvers/docker/docker-auth.service.js';
import { DockerManifestService } from '@app/unraid-api/graph/resolvers/docker/docker-manifest.service.js';

vi.mock('got', () => ({
    got: {
        head: vi.fn(),
        get: vi.fn(),
    },
}));

vi.mock('@app/core/utils/index.js', () => ({
    docker: {
        getImage: vi.fn(() => ({
            inspect: vi.fn(),
        })),
        getContainer: vi.fn(() => ({
            inspect: vi.fn(),
        })),
    },
}));

describe('DockerManifestService', () => {
    let service: DockerManifestService;
    let mockDockerAuthService: any;
    let mockGot: any;

    beforeEach(async () => {
        vi.clearAllMocks();

        mockDockerAuthService = {
            readDockerAuth: vi.fn(),
            decodeAuth: vi.fn(),
            getBearerToken: vi.fn(),
        };

        const { got } = await import('got');
        mockGot = vi.mocked(got);
        mockGot.head.mockReset();
        mockGot.get.mockReset();

        service = new DockerManifestService(mockDockerAuthService);
    });

    describe('parseImageRef - Unit Tests', () => {
        it('should parse simple image name with default tag', () => {
            const result = service.parseImageRef('nginx');

            expect(result).toEqual({
                registryBaseURL: 'https://registry-1.docker.io',
                authConfigKey: 'https://index.docker.io/v1/',
                repoPath: 'library/nginx',
                tag: 'latest',
            });
        });

        it('should parse image name with explicit tag', () => {
            const result = service.parseImageRef('nginx:1.21');

            expect(result).toEqual({
                registryBaseURL: 'https://registry-1.docker.io',
                authConfigKey: 'https://index.docker.io/v1/',
                repoPath: 'library/nginx',
                tag: '1.21',
            });
        });

        it('should parse Docker Hub organization image', () => {
            const result = service.parseImageRef('ubuntu/nginx:latest');

            expect(result).toEqual({
                registryBaseURL: 'https://registry-1.docker.io',
                authConfigKey: 'https://index.docker.io/v1/',
                repoPath: 'ubuntu/nginx',
                tag: 'latest',
            });
        });

        it('should parse custom registry with port', () => {
            const result = service.parseImageRef('registry.example.com:5000/myorg/myapp:v1.0');

            expect(result).toEqual({
                registryBaseURL: 'https://registry.example.com:5000',
                authConfigKey: 'registry.example.com:5000',
                repoPath: 'myorg/myapp',
                tag: 'v1.0',
            });
        });

        it('should parse custom registry without port', () => {
            const result = service.parseImageRef('registry.example.com/myorg/myapp:v1.0');

            expect(result).toEqual({
                registryBaseURL: 'https://registry.example.com',
                authConfigKey: 'registry.example.com',
                repoPath: 'myorg/myapp',
                tag: 'v1.0',
            });
        });

        it('should handle docker.io explicit registry', () => {
            const result = service.parseImageRef('docker.io/nginx:latest');

            expect(result).toEqual({
                registryBaseURL: 'https://registry-1.docker.io',
                authConfigKey: 'https://index.docker.io/v1/',
                repoPath: 'docker.io/nginx',
                tag: 'latest',
            });
        });

        it('should handle complex tag with multiple colons', () => {
            const result = service.parseImageRef('nginx:alpine-3.14.2');

            expect(result).toEqual({
                registryBaseURL: 'https://registry-1.docker.io',
                authConfigKey: 'https://index.docker.io/v1/',
                repoPath: 'library/nginx',
                tag: 'alpine-3.14.2',
            });
        });

        it('should handle localhost registry', () => {
            const result = service.parseImageRef('localhost:5000/myapp:latest');

            expect(result).toEqual({
                registryBaseURL: 'https://localhost:5000',
                authConfigKey: 'localhost:5000',
                repoPath: 'myapp',
                tag: 'latest',
            });
        });

        it('should handle deep nested repository path', () => {
            const result = service.parseImageRef('registry.example.com/team/project/service:v1.0.0');

            expect(result).toEqual({
                registryBaseURL: 'https://registry.example.com',
                authConfigKey: 'registry.example.com',
                repoPath: 'team/project/service',
                tag: 'v1.0.0',
            });
        });
    });

    describe('headManifest - Unit Tests', () => {
        it('should return response when request succeeds', async () => {
            const mockResponse = {
                statusCode: 200,
                headers: { 'docker-content-digest': 'sha256:abc123' },
            };
            mockGot.head.mockResolvedValue(mockResponse);

            const result = await service.headManifest(
                'https://registry-1.docker.io/v2/library/nginx/manifests/latest',
                { Accept: 'application/vnd.docker.distribution.manifest.v2+json' },
                {},
                mockGot
            );

            expect(result).toEqual(mockResponse);
        });

        it('should fallback to GET when HEAD fails', async () => {
            const mockGetResponse = {
                statusCode: 200,
                headers: { 'docker-content-digest': 'sha256:def456' },
            };

            mockGot.head.mockRejectedValue(new Error('HEAD not supported'));
            mockGot.get.mockResolvedValue(mockGetResponse);

            const result = await service.headManifest(
                'https://registry-1.docker.io/v2/library/nginx/manifests/latest',
                { Accept: 'application/vnd.docker.distribution.manifest.v2+json' },
                {},
                mockGot
            );

            expect(result).toEqual(mockGetResponse);
        });
    });

    describe('getRemoteDigest - Unit Tests', () => {
        it('should return digest for public image (anonymous access)', async () => {
            const mockResponse = {
                statusCode: 200,
                headers: { 'docker-content-digest': 'sha256:abc123def456' },
            };
            mockGot.head.mockResolvedValueOnce(mockResponse);
            mockDockerAuthService.readDockerAuth.mockResolvedValueOnce({});

            const result = await service.getRemoteDigest('nginx:latest');

            expect(result).toBe('sha256:abc123def456');
        });

        it('should handle array digest header', async () => {
            const mockResponse = {
                statusCode: 200,
                headers: { 'docker-content-digest': ['sha256:abc123def456', 'sha256:other'] },
            };
            mockGot.head.mockResolvedValueOnce(mockResponse);
            mockDockerAuthService.readDockerAuth.mockResolvedValueOnce({});

            const result = await service.getRemoteDigest('nginx:latest');

            expect(result).toBe('sha256:abc123def456');
        });

        it('should authenticate with Bearer token when registry requires it', async () => {
            const unauthorizedResponse = {
                statusCode: 401,
                headers: {
                    'www-authenticate':
                        'Bearer realm="https://auth.docker.io/token",service="registry.docker.io",scope="repository:library/nginx:pull"',
                },
            };
            const authorizedResponse = {
                statusCode: 200,
                headers: { 'docker-content-digest': 'sha256:authenticated' },
            };

            mockGot.head
                .mockResolvedValueOnce(unauthorizedResponse)
                .mockResolvedValueOnce(authorizedResponse);

            mockDockerAuthService.readDockerAuth.mockResolvedValueOnce({
                'https://index.docker.io/v1/': { auth: 'dXNlcjpwYXNz' },
            });
            mockDockerAuthService.decodeAuth.mockReturnValueOnce({ username: 'user', password: 'pass' });
            mockDockerAuthService.getBearerToken.mockResolvedValueOnce('bearer-token-123');

            const result = await service.getRemoteDigest('nginx:latest');

            expect(result).toBe('sha256:authenticated');
        });

        it('should handle private registries requiring authentication', async () => {
            const authorizedResponse = {
                statusCode: 200,
                headers: { 'docker-content-digest': 'sha256:private-registry' },
            };

            mockGot.head.mockResolvedValueOnce(authorizedResponse);
            mockDockerAuthService.readDockerAuth.mockResolvedValueOnce({
                'registry.example.com': { auth: 'dXNlcjpwYXNz' },
            });

            const result = await service.getRemoteDigest('registry.example.com/private/app:v1.0');

            expect(result).toBe('sha256:private-registry');
        });

        it('should return null when authentication fails', async () => {
            const unauthorizedResponse = {
                statusCode: 401,
                headers: {
                    'www-authenticate':
                        'Bearer realm="https://auth.docker.io/token",service="registry.docker.io"',
                },
            };

            mockGot.head.mockResolvedValue(unauthorizedResponse);
            mockDockerAuthService.readDockerAuth.mockResolvedValueOnce({});
            mockDockerAuthService.decodeAuth.mockReturnValueOnce({ username: '', password: '' });
            mockDockerAuthService.getBearerToken.mockResolvedValueOnce(null);

            const result = await service.getRemoteDigest('nginx:latest');

            expect(result).toBeNull();
        });

        it('should return null when no digest is available', async () => {
            const mockResponse = {
                statusCode: 200,
                headers: {},
            };
            mockGot.head.mockResolvedValueOnce(mockResponse);
            mockDockerAuthService.readDockerAuth.mockResolvedValueOnce({});

            const result = await service.getRemoteDigest('nginx:latest');

            expect(result).toBeNull();
        });

        it('should work with custom registries', async () => {
            const authorizedResponse = {
                statusCode: 200,
                headers: { 'docker-content-digest': 'sha256:custom-registry' },
            };

            mockGot.head.mockResolvedValueOnce(authorizedResponse);
            mockDockerAuthService.readDockerAuth.mockResolvedValueOnce({});

            const result = await service.getRemoteDigest('registry.example.com/myapp:v1.0');

            expect(result).toBe('sha256:custom-registry');
        });

        it('should handle images with no explicit tag (defaults to latest)', async () => {
            const mockResponse = {
                statusCode: 200,
                headers: { 'docker-content-digest': 'sha256:latest-digest' },
            };
            mockGot.head.mockResolvedValueOnce(mockResponse);
            mockDockerAuthService.readDockerAuth.mockResolvedValueOnce({});

            const result = await service.getRemoteDigest('alpine');

            expect(result).toBe('sha256:latest-digest');
        });

        it('should handle registry errors gracefully', async () => {
            const errorResponse = {
                statusCode: 500,
                headers: {},
            };
            mockGot.head.mockResolvedValueOnce(errorResponse);
            mockDockerAuthService.readDockerAuth.mockResolvedValueOnce({});

            const result = await service.getRemoteDigest('nginx:latest');

            expect(result).toBeNull();
        });
    });
});
