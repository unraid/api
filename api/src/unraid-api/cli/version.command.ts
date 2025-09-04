import { Command, CommandRunner, Option } from 'nest-commander';

import { API_VERSION } from '@app/environment.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';

interface VersionOptions {
    json?: boolean;
}

@Command({ name: 'version', description: 'Display API version information' })
export class VersionCommand extends CommandRunner {
    constructor(private readonly logger: LogService) {
        super();
    }

    @Option({
        flags: '-j, --json',
        description: 'Output version information as JSON',
    })
    parseJson(): boolean {
        return true;
    }

    async run(passedParam: string[], options?: VersionOptions): Promise<void> {
        if (options?.json) {
            const [baseVersion, buildInfo] = API_VERSION.split('+');
            const versionInfo = {
                version: baseVersion || API_VERSION,
                build: buildInfo || undefined,
                combined: API_VERSION,
            };
            console.log(JSON.stringify(versionInfo));
        } else {
            this.logger.info(`Unraid API v${API_VERSION}`);
        }
    }
}
