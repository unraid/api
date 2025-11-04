import { Injectable, Logger } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

import { XMLParser } from 'fast-xml-parser';

import { PATHS_DOCKER_TEMPLATES } from '@app/environment.js';
import { DockerConfigService } from '@app/unraid-api/graph/resolvers/docker/docker-config.service.js';
import { DockerTemplateSyncResult } from '@app/unraid-api/graph/resolvers/docker/docker-template-scanner.model.js';
import { DockerContainer } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';

interface ParsedTemplate {
    filePath: string;
    name?: string;
    repository?: string;
}

@Injectable()
export class DockerTemplateScannerService {
    private readonly logger = new Logger(DockerTemplateScannerService.name);
    private readonly xmlParser = new XMLParser({
        ignoreAttributes: false,
        parseAttributeValue: true,
        trimValues: true,
    });

    constructor(
        private readonly dockerConfigService: DockerConfigService,
        private readonly dockerService: DockerService
    ) {}

    @Timeout(5_000)
    async bootstrapScan(attempt = 1, maxAttempts = 5): Promise<void> {
        try {
            this.logger.log(`Starting template scan (attempt ${attempt}/${maxAttempts})`);
            const result = await this.scanTemplates();
            this.logger.log(
                `Template scan complete: ${result.matched} matched, ${result.scanned} scanned, ${result.skipped} skipped`
            );
        } catch (error) {
            if (attempt < maxAttempts) {
                this.logger.warn(
                    `Template scan failed (attempt ${attempt}/${maxAttempts}), retrying in 60s: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
                setTimeout(() => this.bootstrapScan(attempt + 1, maxAttempts), 60_000);
            } else {
                this.logger.error(
                    `Template scan failed after ${maxAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        }
    }

    async syncMissingContainers(containers: DockerContainer[]): Promise<boolean> {
        const config = this.dockerConfigService.getConfig();
        const mappings = config.templateMappings || {};
        const skipSet = new Set(config.skipTemplatePaths || []);

        const needsSync = containers.filter((c) => {
            const containerName = this.normalizeContainerName(c.names[0]);
            return !mappings[containerName] && !skipSet.has(containerName);
        });

        if (needsSync.length > 0) {
            this.logger.log(
                `Found ${needsSync.length} containers without template mappings, triggering sync`
            );
            await this.scanTemplates();
            return true;
        }
        return false;
    }

    async scanTemplates(): Promise<DockerTemplateSyncResult> {
        const result: DockerTemplateSyncResult = {
            scanned: 0,
            matched: 0,
            skipped: 0,
            errors: [],
        };

        const templates = await this.loadAllTemplates(result);

        try {
            const containers = await this.dockerService.getContainers({ skipCache: true });
            const config = this.dockerConfigService.getConfig();
            const currentMappings = config.templateMappings || {};
            const skipSet = new Set(config.skipTemplatePaths || []);

            const newMappings: Record<string, string | null> = { ...currentMappings };

            for (const container of containers) {
                const containerName = this.normalizeContainerName(container.names[0]);
                if (skipSet.has(containerName)) {
                    result.skipped++;
                    continue;
                }

                const match = this.matchContainerToTemplate(container, templates);
                if (match) {
                    newMappings[containerName] = match.filePath;
                    result.matched++;
                } else {
                    newMappings[containerName] = null;
                }
            }

            await this.updateMappings(newMappings);
        } catch (error) {
            const errorMsg = `Failed to get containers: ${error instanceof Error ? error.message : 'Unknown error'}`;
            this.logger.error(error, 'Failed to get containers');
            result.errors.push(errorMsg);
        }

        return result;
    }

    private async loadAllTemplates(result: DockerTemplateSyncResult): Promise<ParsedTemplate[]> {
        const allTemplates: ParsedTemplate[] = [];

        for (const directory of PATHS_DOCKER_TEMPLATES) {
            try {
                const files = await readdir(directory);
                const xmlFiles = files.filter((f) => f.endsWith('.xml'));
                result.scanned += xmlFiles.length;

                for (const file of xmlFiles) {
                    const filePath = join(directory, file);
                    try {
                        const template = await this.parseTemplate(filePath);
                        if (template) {
                            allTemplates.push(template);
                        }
                    } catch (error) {
                        const errorMsg = `Failed to parse template ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                        this.logger.warn(errorMsg);
                        result.errors.push(errorMsg);
                    }
                }
            } catch (error) {
                const errorMsg = `Failed to read template directory ${directory}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                this.logger.warn(errorMsg);
                result.errors.push(errorMsg);
            }
        }

        return allTemplates;
    }

    private async parseTemplate(filePath: string): Promise<ParsedTemplate | null> {
        const content = await readFile(filePath, 'utf-8');
        const parsed = this.xmlParser.parse(content);

        if (!parsed.Container) {
            return null;
        }

        const container = parsed.Container;
        return {
            filePath,
            name: container.Name,
            repository: container.Repository,
        };
    }

    private matchContainerToTemplate(
        container: DockerContainer,
        templates: ParsedTemplate[]
    ): ParsedTemplate | null {
        const containerName = this.normalizeContainerName(container.names[0]);
        const containerImage = this.normalizeRepository(container.image);

        for (const template of templates) {
            if (template.name && this.normalizeContainerName(template.name) === containerName) {
                return template;
            }
        }

        for (const template of templates) {
            if (
                template.repository &&
                this.normalizeRepository(template.repository) === containerImage
            ) {
                return template;
            }
        }

        return null;
    }

    private normalizeContainerName(name: string): string {
        return name.replace(/^\//, '').toLowerCase();
    }

    private normalizeRepository(repository: string): string {
        return repository.split(':')[0].toLowerCase();
    }

    private async updateMappings(mappings: Record<string, string | null>): Promise<void> {
        const config = this.dockerConfigService.getConfig();
        const updated = await this.dockerConfigService.validate({
            ...config,
            templateMappings: mappings,
        });
        this.dockerConfigService.replaceConfig(updated);
    }
}
