import { Command, CommandRunner, Option } from 'nest-commander';

import { NodemonService } from '@app/unraid-api/cli/nodemon.service.js';

interface StopCommandOptions {
    force: boolean;
}
@Command({
    name: 'stop',
    description: 'Stop the Unraid API',
})
export class StopCommand extends CommandRunner {
    constructor(private readonly nodemon: NodemonService) {
        super();
    }

    @Option({
        flags: '-f, --force',
        description: 'Forcefully stop the API process',
    })
    parseForce(): boolean {
        return true;
    }

    async run(_: string[], options: StopCommandOptions = { force: false }) {
        await this.nodemon.stop({ force: options.force });
    }
}
