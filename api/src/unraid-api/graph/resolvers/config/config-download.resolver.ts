import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';
import { convert } from 'convert';

import { PATHS_CONFIG_MODULES } from '@app/environment.js';
import { ApiConfigPersistence } from '@app/unraid-api/config/api-config.module.js';
import {
    ConfigFile,
    ConfigFilesResponse,
} from '@app/unraid-api/graph/resolvers/config/config-download.model.js';

@Injectable()
@Resolver(() => ConfigFilesResponse)
export class ConfigDownloadResolver {
    constructor(
        private readonly configService: ConfigService,
        private readonly apiConfigPersistence: ApiConfigPersistence
    ) {}

    private formatFileSize(content: string): string {
        const bytes = Buffer.byteLength(content, 'utf8');
        return convert(bytes, 'bytes').to('best').toString();
    }

    private async getConfigFile(fileName: string, filePath?: string): Promise<ConfigFile | null> {
        try {
            let content: string;
            let actualPath: string;

            // Handle memory-based configs
            if (fileName === 'api.json') {
                const config = this.configService.get('api');
                if (!config) return null;
                content = JSON.stringify(config, null, 2);
                actualPath = this.apiConfigPersistence.configPath();
            } else if (fileName === 'oidc.json') {
                const config = this.configService.get('oidc');
                if (!config) return null;
                content = JSON.stringify(config, null, 2);
                actualPath = path.join(PATHS_CONFIG_MODULES, 'oidc.json');
            } else if (fileName === 'store-config.json') {
                const config = this.configService.get('store');
                if (!config) return null;
                content = JSON.stringify(config, null, 2);
                actualPath = 'memory';
            } else {
                // Handle file-based configs
                actualPath = filePath || path.join(PATHS_CONFIG_MODULES, fileName);
                if (!existsSync(actualPath)) return null;
                content = await readFile(actualPath, 'utf-8');
            }

            return {
                name: fileName,
                content,
                path: actualPath,
                sizeReadable: this.formatFileSize(content),
            };
        } catch (error) {
            console.warn(`Could not read config file ${fileName}:`, error);
            return null;
        }
    }

    @Query(() => ConfigFilesResponse)
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.CONFIG,
    })
    async allConfigFiles(): Promise<ConfigFilesResponse> {
        const files: ConfigFile[] = [];

        // Define all config files to retrieve
        const configSources = [
            { name: 'api.json' },
            { name: 'oidc.json' },
            { name: 'user-preferences.json' },
            { name: 'connect.json' },
            { name: 'my-servers.json' },
            { name: 'store-config.json' },
        ];

        // Retrieve all config files
        for (const source of configSources) {
            const file = await this.getConfigFile(source.name);
            if (file) {
                files.push(file);
            }
        }

        return { files };
    }

    @Query(() => ConfigFile, { nullable: true })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.CONFIG,
    })
    async configFile(@Args('name') fileName: string): Promise<ConfigFile | null> {
        const file = await this.getConfigFile(fileName);
        if (!file) {
            throw new NotFoundException(`Config file ${fileName} not found`);
        }
        return file;
    }
}
