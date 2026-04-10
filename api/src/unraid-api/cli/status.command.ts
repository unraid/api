import { Command, CommandRunner } from 'nest-commander';

import { PM2Service } from '@app/unraid-api/cli/pm2.service.js';

@Command({ name: 'status', description: 'Check status of unraid-api service' })
export class StatusCommand extends CommandRunner {
    constructor(private readonly pm2: PM2Service) {
        super();
    }
    async run(): Promise<void> {
        await this.pm2.run({ tag: 'PM2 Status', stdio: 'inherit', raw: true }, 'status', 'unraid-api');
    }
}
