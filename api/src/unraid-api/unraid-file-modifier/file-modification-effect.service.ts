import { Injectable, Logger } from '@nestjs/common';

import { ONE_SECOND_MS } from '@app/consts.js';
import { NginxService } from '@app/unraid-api/nginx/nginx.service.js';
import { ModificationEffect } from '@app/unraid-api/unraid-file-modifier/file-modification.js';

@Injectable()
export class FileModificationEffectService {
    private readonly logger = new Logger(FileModificationEffectService.name);
    constructor(private readonly nginxService: NginxService) {}
    async runEffect(effect: ModificationEffect): Promise<void> {
        switch (effect) {
            case 'nginx:reload':
                this.logger.log('Reloading Nginx in 10 seconds...');
                await new Promise((resolve) => setTimeout(resolve, 10 * ONE_SECOND_MS));
                await this.nginxService.reload();
                break;
        }
    }
}
