import { Injectable, Logger } from '@nestjs/common';

import { execa } from 'execa';

@Injectable()
export class ConnectService {
    private logger = new Logger(ConnectService.name);
    async restartApi() {
        try {
            await execa('unraid-api', ['restart'], { shell: 'bash', stdio: 'ignore' });
        } catch (error) {
            this.logger.error(error);
        }
    }
}
