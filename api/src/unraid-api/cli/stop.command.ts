import { Command, CommandRunner, Option } from 'nest-commander';

import { ECOSYSTEM_PATH } from '@app/consts';
import { PM2Service } from '@app/unraid-api/cli/pm2.service';

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
        // Stop and remove the PM2 process
        await this.pm2.run({ tag: 'PM2 Stop', stdio: 'inherit' }, 'stop', ECOSYSTEM_PATH);

        // Wait a short time for processes to stop gracefully
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Force kill any remaining instances
        try {
            await this.pm2.run({ tag: 'PM2 Kill', stdio: 'inherit' }, 'kill');
        } catch (e) {
            // Ignore kill errors as process might already be gone
        }

        await this.pm2.run({ tag: 'PM2 Delete', stdio: 'inherit' }, 'delete', ECOSYSTEM_PATH);
        await this.pm2.run({ tag: 'PM2 Save', stdio: 'inherit' }, 'save');

        if (options.delete) {
            await this.pm2.stopPm2Daemon();
            await this.pm2.deletePm2Home();
        }
    }
}
