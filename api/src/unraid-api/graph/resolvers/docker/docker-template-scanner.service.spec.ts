import { Test, TestingModule } from '@nestjs/testing';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DockerConfigService } from '@app/unraid-api/graph/resolvers/docker/docker-config.service.js';
import { DockerTemplateScannerService } from '@app/unraid-api/graph/resolvers/docker/docker-template-scanner.service.js';
import { DockerContainer } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';

vi.mock('@app/environment.js', () => ({
    PATHS_DOCKER_TEMPLATES: ['/tmp/test-templates'],
    ENABLE_NEXT_DOCKER_RELEASE: true,
}));

describe('DockerTemplateScannerService', () => {
    let service: DockerTemplateScannerService;
    let dockerConfigService: DockerConfigService;
    let dockerService: DockerService;
    const testTemplateDir = '/tmp/test-templates';

    beforeEach(async () => {
        await mkdir(testTemplateDir, { recursive: true });

        const mockDockerService = {
            getRawContainers: vi.fn(),
        };

        const mockDockerConfigService = {
            getConfig: vi.fn(),
            replaceConfig: vi.fn(),
            validate: vi.fn((config) => Promise.resolve(config)),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DockerTemplateScannerService,
                {
                    provide: DockerConfigService,
                    useValue: mockDockerConfigService,
                },
                {
                    provide: DockerService,
                    useValue: mockDockerService,
                },
            ],
        }).compile();

        service = module.get<DockerTemplateScannerService>(DockerTemplateScannerService);
        dockerConfigService = module.get<DockerConfigService>(DockerConfigService);
        dockerService = module.get<DockerService>(DockerService);
    });

    afterEach(async () => {
        await rm(testTemplateDir, { recursive: true, force: true });
    });

    describe('parseTemplate', () => {
        it('should parse valid XML template', async () => {
            const templatePath = join(testTemplateDir, 'test.xml');
            const templateContent = `<?xml version="1.0"?>
<Container version="2">
  <Name>test-container</Name>
  <Repository>test/image</Repository>
</Container>`;
            await writeFile(templatePath, templateContent);

            const result = await (service as any).parseTemplate(templatePath);

            expect(result).toEqual({
                filePath: templatePath,
                name: 'test-container',
                repository: 'test/image',
            });
        });

        it('should handle invalid XML gracefully by returning null', async () => {
            const templatePath = join(testTemplateDir, 'invalid.xml');
            await writeFile(templatePath, 'not xml');

            const result = await (service as any).parseTemplate(templatePath);
            expect(result).toBeNull();
        });

        it('should return null for XML without Container element', async () => {
            const templatePath = join(testTemplateDir, 'no-container.xml');
            const templateContent = `<?xml version="1.0"?><Root></Root>`;
            await writeFile(templatePath, templateContent);

            const result = await (service as any).parseTemplate(templatePath);

            expect(result).toBeNull();
        });
    });

    describe('matchContainerToTemplate', () => {
        it('should match by container name (exact match)', () => {
            const container: DockerContainer = {
                id: 'abc123',
                names: ['/test-container'],
                image: 'different/image:latest',
            } as DockerContainer;

            const templates = [
                { filePath: '/path/1', name: 'test-container', repository: 'some/repo' },
                { filePath: '/path/2', name: 'other', repository: 'other/repo' },
            ];

            const result = (service as any).matchContainerToTemplate(container, templates);

            expect(result).toEqual(templates[0]);
        });

        it('should match by repository when name does not match', () => {
            const container: DockerContainer = {
                id: 'abc123',
                names: ['/my-container'],
                image: 'test/image:v1.0',
            } as DockerContainer;

            const templates = [
                { filePath: '/path/1', name: 'different', repository: 'other/repo' },
                { filePath: '/path/2', name: 'also-different', repository: 'test/image' },
            ];

            const result = (service as any).matchContainerToTemplate(container, templates);

            expect(result).toEqual(templates[1]);
        });

        it('should strip tags when matching repository', () => {
            const container: DockerContainer = {
                id: 'abc123',
                names: ['/my-container'],
                image: 'test/image:latest',
            } as DockerContainer;

            const templates = [
                { filePath: '/path/1', name: 'different', repository: 'test/image:v1.0' },
            ];

            const result = (service as any).matchContainerToTemplate(container, templates);

            expect(result).toEqual(templates[0]);
        });

        it('should return null when no match found', () => {
            const container: DockerContainer = {
                id: 'abc123',
                names: ['/my-container'],
                image: 'test/image:latest',
            } as DockerContainer;

            const templates = [{ filePath: '/path/1', name: 'different', repository: 'other/image' }];

            const result = (service as any).matchContainerToTemplate(container, templates);

            expect(result).toBeNull();
        });

        it('should be case-insensitive', () => {
            const container: DockerContainer = {
                id: 'abc123',
                names: ['/Test-Container'],
                image: 'Test/Image:latest',
            } as DockerContainer;

            const templates = [
                { filePath: '/path/1', name: 'test-container', repository: 'test/image' },
            ];

            const result = (service as any).matchContainerToTemplate(container, templates);

            expect(result).toEqual(templates[0]);
        });
    });

    describe('scanTemplates', () => {
        it('should scan templates and create mappings', async () => {
            const template1 = join(testTemplateDir, 'redis.xml');
            await writeFile(
                template1,
                `<?xml version="1.0"?>
<Container version="2">
  <Name>redis</Name>
  <Repository>redis</Repository>
</Container>`
            );

            const containers: DockerContainer[] = [
                {
                    id: 'container1',
                    names: ['/redis'],
                    image: 'redis:latest',
                } as DockerContainer,
            ];

            vi.mocked(dockerService.getRawContainers).mockResolvedValue(containers);
            vi.mocked(dockerConfigService.getConfig).mockReturnValue({
                updateCheckCronSchedule: '0 6 * * *',
                templateMappings: {},
                skipTemplatePaths: [],
            });

            const result = await service.scanTemplates();

            expect(result.scanned).toBe(1);
            expect(result.matched).toBe(1);
            expect(result.errors).toHaveLength(0);
            expect(dockerConfigService.replaceConfig).toHaveBeenCalledWith(
                expect.objectContaining({
                    templateMappings: {
                        redis: template1,
                    },
                })
            );
        });

        it('should skip containers in skipTemplatePaths', async () => {
            const template1 = join(testTemplateDir, 'redis.xml');
            await writeFile(
                template1,
                `<?xml version="1.0"?>
<Container version="2">
  <Name>redis</Name>
  <Repository>redis</Repository>
</Container>`
            );

            const containers: DockerContainer[] = [
                {
                    id: 'container1',
                    names: ['/redis'],
                    image: 'redis:latest',
                } as DockerContainer,
            ];

            vi.mocked(dockerService.getRawContainers).mockResolvedValue(containers);
            vi.mocked(dockerConfigService.getConfig).mockReturnValue({
                updateCheckCronSchedule: '0 6 * * *',
                templateMappings: {},
                skipTemplatePaths: ['redis'],
            });

            const result = await service.scanTemplates();

            expect(result.skipped).toBe(1);
            expect(result.matched).toBe(0);
        });

        it('should handle missing template directory gracefully', async () => {
            await rm(testTemplateDir, { recursive: true, force: true });

            const containers: DockerContainer[] = [];

            vi.mocked(dockerService.getRawContainers).mockResolvedValue(containers);
            vi.mocked(dockerConfigService.getConfig).mockReturnValue({
                updateCheckCronSchedule: '0 6 * * *',
                templateMappings: {},
                skipTemplatePaths: [],
            });

            const result = await service.scanTemplates();

            expect(result.scanned).toBe(0);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should handle docker service errors gracefully', async () => {
            vi.mocked(dockerService.getRawContainers).mockRejectedValue(new Error('Docker error'));
            vi.mocked(dockerConfigService.getConfig).mockReturnValue({
                updateCheckCronSchedule: '0 6 * * *',
                templateMappings: {},
                skipTemplatePaths: [],
            });

            const result = await service.scanTemplates();

            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('Failed to get containers');
        });

        it('should set null mapping for unmatched containers', async () => {
            const containers: DockerContainer[] = [
                {
                    id: 'container1',
                    names: ['/unknown'],
                    image: 'unknown:latest',
                } as DockerContainer,
            ];

            vi.mocked(dockerService.getRawContainers).mockResolvedValue(containers);
            vi.mocked(dockerConfigService.getConfig).mockReturnValue({
                updateCheckCronSchedule: '0 6 * * *',
                templateMappings: {},
                skipTemplatePaths: [],
            });

            await service.scanTemplates();

            expect(dockerConfigService.replaceConfig).toHaveBeenCalledWith(
                expect.objectContaining({
                    templateMappings: {
                        unknown: null,
                    },
                })
            );
        });
    });

    describe('syncMissingContainers', () => {
        it('should return true and trigger scan when containers are missing mappings', async () => {
            const containers: DockerContainer[] = [
                {
                    id: 'container1',
                    names: ['/redis'],
                    image: 'redis:latest',
                } as DockerContainer,
            ];

            vi.mocked(dockerConfigService.getConfig).mockReturnValue({
                updateCheckCronSchedule: '0 6 * * *',
                templateMappings: {},
                skipTemplatePaths: [],
            });

            vi.mocked(dockerService.getRawContainers).mockResolvedValue(containers);

            const scanSpy = vi.spyOn(service, 'scanTemplates').mockResolvedValue({
                scanned: 0,
                matched: 0,
                skipped: 0,
                errors: [],
            });

            const result = await service.syncMissingContainers(containers);

            expect(result).toBe(true);
            expect(scanSpy).toHaveBeenCalled();
        });

        it('should return false when all containers have mappings', async () => {
            const containers: DockerContainer[] = [
                {
                    id: 'container1',
                    names: ['/redis'],
                    image: 'redis:latest',
                } as DockerContainer,
            ];

            vi.mocked(dockerConfigService.getConfig).mockReturnValue({
                updateCheckCronSchedule: '0 6 * * *',
                templateMappings: {
                    redis: '/path/to/template.xml',
                },
                skipTemplatePaths: [],
            });

            const scanSpy = vi.spyOn(service, 'scanTemplates');

            const result = await service.syncMissingContainers(containers);

            expect(result).toBe(false);
            expect(scanSpy).not.toHaveBeenCalled();
        });

        it('should not trigger scan for containers in skip list', async () => {
            const containers: DockerContainer[] = [
                {
                    id: 'container1',
                    names: ['/redis'],
                    image: 'redis:latest',
                } as DockerContainer,
            ];

            vi.mocked(dockerConfigService.getConfig).mockReturnValue({
                updateCheckCronSchedule: '0 6 * * *',
                templateMappings: {},
                skipTemplatePaths: ['redis'],
            });

            const scanSpy = vi.spyOn(service, 'scanTemplates');

            const result = await service.syncMissingContainers(containers);

            expect(result).toBe(false);
            expect(scanSpy).not.toHaveBeenCalled();
        });
    });

    describe('normalizeContainerName', () => {
        it('should remove leading slash', () => {
            const result = (service as any).normalizeContainerName('/container-name');
            expect(result).toBe('container-name');
        });

        it('should convert to lowercase', () => {
            const result = (service as any).normalizeContainerName('/Container-Name');
            expect(result).toBe('container-name');
        });
    });

    describe('normalizeRepository', () => {
        it('should strip tag', () => {
            const result = (service as any).normalizeRepository('redis:latest');
            expect(result).toBe('redis');
        });

        it('should strip version tag', () => {
            const result = (service as any).normalizeRepository('postgres:14.5');
            expect(result).toBe('postgres');
        });

        it('should convert to lowercase', () => {
            const result = (service as any).normalizeRepository('Redis:Latest');
            expect(result).toBe('redis');
        });

        it('should handle repository without tag', () => {
            const result = (service as any).normalizeRepository('nginx');
            expect(result).toBe('nginx');
        });
    });
});
