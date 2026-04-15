import { Command, CommandRunner, Option } from 'nest-commander';

import { ECOSYSTEM_PATH } from '@app/environment.js';
import { PM2Service } from '@app/unraid-api/cli/pm2.service.js';

interface StopCommandOptions {
    delete: boolean;
}
@Command({
    name: 'stop',
    description: 'Stop the Unraid API',
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
        if (options.delete) {
            await this.pm2.run({ tag: 'PM2 Kill', stdio: 'inherit' }, 'kill', '--no-autorestart');
            await this.pm2.forceKillPm2Daemon();
            await this.pm2.deletePm2Home();
        } else {
            await this.pm2.run(
                { tag: 'PM2 Delete', stdio: 'inherit' },
                'delete',
                ECOSYSTEM_PATH,
                '--no-autorestart',
                '--mini-list'
            );
        }
    }
}
