import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { LxcContainer } from '@app/unraid-api/graph/resolvers/lxc/lxc.model.js';

const execAsync = promisify(exec);

@Injectable()
export class LxcService implements OnModuleInit {
    private readonly logger = new Logger(LxcService.name);

    async getAppInfo() {
        const containers = await this.getContainers();
        const installedCount = containers.length;
        return {
            info: {
                apps: { installed: installedCount },
            },
        };
    }

    public async onModuleInit() {
        try {
            const appInfo = await this.getAppInfo();
            await pubsub.publish(PUBSUB_CHANNEL.INFO, appInfo);
        } catch (error) {
            this.logger.warn('Error initializing Lxc module:', error);
            this.logger.warn('Lxc may be disabled under Settings -> Lxc.');
        }
    }

    public async getContainers(): Promise<LxcContainer[]> {
        try {
            const { stdout } = await execAsync('lxc-ls -f');
            const lines = stdout.trim().split('\n');
            if (lines.length < 2) {
                return [];
            }

            const headers = lines[0].trim().split(/\s{2,}/);
            const containers: LxcContainer[] = lines.slice(1).map((line, index) => {
                const values = line.trim().split(/\s{2,}/);
                const data: Record<string, string | null> = {};
                headers.forEach((header, i) => {
                    data[header.toLowerCase()] = values[i] || null;
                });

                return {
                    id: `lxc_${index}`,
                    name: data.name ?? `container_${index}`,
                    state: data.state ?? '',
                    ipv4: data.ipv4 ?? '',
                    autostart: data.autostart === 'YES' ? 'YES' : 'NO',
                } as LxcContainer;
            });

            return containers;
        } catch (error) {
            this.logger.error('Error while getting informations from LXC', error);
            return [];
        }
    }
}
