import { Command, CommandRunner } from 'nest-commander';

import { ECOSYSTEM_PATH } from '@app/consts';

import { PM2Service } from './pm2.service';

@Command({
    name: 'stop',
})
export class StopCommand extends CommandRunner {
    constructor(private readonly pm2: PM2Service) {
        super();
    }
    async run() {
        const { stderr } = await this.pm2.run({ tag: 'PM2 Stop' }, 'stop', ECOSYSTEM_PATH);
        if (stderr) {
            process.exit(1);
        }
        process.exit(0);
    }
}
