import { Command, CommandRunner } from 'nest-commander';

import { ECOSYSTEM_PATH } from '@app/consts';
import { PM2Service } from '@app/unraid-api/cli/pm2.service';

@Command({
    name: 'stop',
})
export class StopCommand extends CommandRunner {
    constructor(private readonly pm2: PM2Service) {
        super();
    }

    async run() {
        // Stop and remove the PM2 process
        await this.pm2.run({ tag: 'PM2 Stop', stdio: 'inherit' }, 'stop', ECOSYSTEM_PATH);
        await this.pm2.run({ tag: 'PM2 Delete', stdio: 'inherit' }, 'delete', ECOSYSTEM_PATH);
        await this.pm2.run({ tag: 'PM2 Save', stdio: 'inherit' }, 'save');
    }
}
