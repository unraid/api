import { readFile } from 'fs/promises';

import { Command, CommandRunner, Option } from 'nest-commander';

import type { MyServersConfigMemory } from '@app/types/my-servers-config.js';
import { getters } from '@app/store/index.js';
import { MyServersConfigMemorySchema } from '@app/types/my-servers-config.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';

@Command({ name: 'report' })
export class ReportCommand extends CommandRunner {
    constructor(private readonly logger: LogService) {
        super();
    }

    @Option({
        flags: '-r, --raw',
        description: 'whether to enable raw command output',
        defaultValue: false,
    })
    parseRaw(): boolean {
        return true;
    }

    @Option({
        flags: '-j, --json',
        description: 'Display JSON output for this command',
        defaultValue: false,
    })
    parseJson(): boolean {
        return true;
    }

    async getBothMyServersConfigsWithoutError(): Promise<MyServersConfigMemory | null> {
        const ini = await import('ini');
        const diskConfig = await readFile(getters.paths()['myservers-config'], 'utf-8').catch(
            (_) => null
        );
        const memoryConfig = await readFile(getters.paths()['myservers-config-states'], 'utf-8').catch(
            (_) => null
        );

        if (memoryConfig) {
            return MyServersConfigMemorySchema.parse(ini.parse(memoryConfig));
        } else if (diskConfig) {
            return MyServersConfigMemorySchema.parse(ini.parse(diskConfig));
        }
        return null;
    }

    async report(): Promise<string | void> {
        try {
            const { isUnraidApiRunning } = await import('@app/core/utils/pm2/unraid-api-running.js');

            const apiRunning = await isUnraidApiRunning().catch((err) => {
                this.logger.debug('failed to get PM2 state with error: ' + err);
                return false;
            });

            const config =
                (await this.getBothMyServersConfigsWithoutError()) as MyServersConfigMemory & {
                    connectionStatus: { running: 'yes' | 'no' };
                };
            config.connectionStatus.running = apiRunning ? 'yes' : 'no';
            this.logger.clear();
            this.logger.info(JSON.stringify(config, null, 2));
        } catch (error) {
            this.logger.debug('Error Generating Config: ' + error);
            this.logger.warn(
                JSON.stringify(
                    { error: 'Please ensure the API is configured before attempting to run a report' },
                    null,
                    2
                )
            );
        }
    }

    async run(): Promise<void> {
        await this.report();
    }
}
