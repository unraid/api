import { Command, CommandRunner } from 'nest-commander';

import { NodemonService } from '@app/unraid-api/cli/nodemon.service.js';

@Command({ name: 'status', description: 'Check status of unraid-api service' })
export class StatusCommand extends CommandRunner {
    constructor(private readonly nodemon: NodemonService) {
        super();
    }
    async run(): Promise<void> {
        await this.nodemon.status();
    }
}
