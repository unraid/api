import { execSync } from 'child_process';

import { Command, CommandRunner } from 'nest-commander';

import { PM2_PATH } from '@app/consts';

@Command({ name: 'status', description: 'Check status of unraid-api service' })
export class StatusCommand extends CommandRunner {
    async run(): Promise<void> {
        execSync(`${PM2_PATH} status unraid-api`, { stdio: 'inherit' });
        process.exit(0);
    }
}
