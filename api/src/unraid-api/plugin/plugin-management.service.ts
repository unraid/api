import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import path from 'node:path';

import { ApiConfig } from '@unraid/shared/services/api-config.js';
import { execa } from 'execa';

@Injectable()
export class PluginManagementService {
    constructor(private readonly configService: ConfigService<{ api: ApiConfig }, true>) {}

    listPlugins() {
        return this.configService.get('api.plugins', { infer: true });
    }

    async addPlugin(plugin: string) {
        await execa('npm', ['run'], {
            stdio: 'inherit',
            cwd: path.join(process.cwd()),
        });
    }
}
