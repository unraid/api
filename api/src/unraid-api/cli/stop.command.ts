import { Command, CommandRunner, Option } from 'nest-commander';

import { ECOSYSTEM_PATH } from '@app/consts';
import { PM2Service } from '@app/unraid-api/cli/pm2.service';

const GRACEFUL_SHUTDOWN_TIME = 2000;
interface StopCommandOptions {
    delete: boolean;
}
@Command({
    name: 'stop',
})
export class StopCommand extends CommandRunner {
    constructor(private readonly pm2: PM2Service) {
        super();
    }

    @Option({
        flags: '-d, --delete',
        description: 'Delete the PM2 home directory',
    })
    parseDelete(): boolean {
        return true;
    }

    async run(_: string[], options: StopCommandOptions = { delete: false }) {
        // Wait a short time for processes to stop gracefully
        await this.pm2.run({ tag: 'PM2 Delete', stdio: 'inherit' }, 'delete', ECOSYSTEM_PATH);

        await new Promise((resolve) => setTimeout(resolve, GRACEFUL_SHUTDOWN_TIME));

        if (options.delete) {
            await this.pm2.run({ tag: 'PM2 Kill', stdio: 'inherit' }, 'kill');
            await this.pm2.stopPm2Daemon();
            await this.pm2.deletePm2Home();
        }
    }
}
