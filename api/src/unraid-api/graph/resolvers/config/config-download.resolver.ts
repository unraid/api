import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Query, Resolver } from '@nestjs/graphql';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { PATHS_CONFIG_MODULES } from '@app/environment.js';
import { ApiConfigPersistence } from '@app/unraid-api/config/api-config.module.js';
import {
    ConfigFile,
    ConfigFilesResponse,
} from '@app/unraid-api/graph/resolvers/config/config-download.model.js';
import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/oidc-config.service.js';

@Injectable()
@Resolver(() => ConfigFilesResponse)
export class ConfigDownloadResolver {
    constructor(
        private readonly configService: ConfigService,
        private readonly apiConfigPersistence: ApiConfigPersistence,
        private readonly oidcConfigPersistence: OidcConfigPersistence
    ) {}

    @Query(() => ConfigFilesResponse)
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.CONFIG,
    })
    async allConfigFiles(): Promise<ConfigFilesResponse> {
        const files: ConfigFile[] = [];

        // Get api.json
        const apiConfig = this.configService.get('api');
        if (apiConfig) {
            files.push({
                name: 'api.json',
                content: JSON.stringify(apiConfig, null, 2),
                path: this.apiConfigPersistence.configPath(),
            });
        }

        // Get oidc.json
        const oidcConfig = this.configService.get('oidc');
        if (oidcConfig) {
            files.push({
                name: 'oidc.json',
                content: JSON.stringify(oidcConfig, null, 2),
                path: path.join(PATHS_CONFIG_MODULES, 'oidc.json'),
            });
        }

        // Get other common config files from the config modules directory
        const configFiles = ['user-preferences.json', 'connect.json', 'my-servers.json'];

        for (const fileName of configFiles) {
            const filePath = path.join(PATHS_CONFIG_MODULES, fileName);
            if (existsSync(filePath)) {
                try {
                    const content = await readFile(filePath, 'utf-8');
                    files.push({
                        name: fileName,
                        content,
                        path: filePath,
                    });
                } catch (error) {
                    // Skip files that can't be read
                    console.warn(`Could not read config file ${fileName}:`, error);
                }
            }
        }

        // Get store config if available
        const storeConfig = this.configService.get('store');
        if (storeConfig) {
            files.push({
                name: 'store-config.json',
                content: JSON.stringify(storeConfig, null, 2),
                path: 'memory',
            });
        }

        return { files };
    }
}
