import { execSync } from 'child_process';

import { Command, CommandRunner, SubCommand } from 'nest-commander';

import { PM2_PATH } from '@app/consts';

@Command({
    name: 'stop',
})
export class StopCommand extends CommandRunner {
    async run() {
        execSync(`${PM2_PATH} stop unraid-api`, { stdio: 'inherit' });
    }
}
