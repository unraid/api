import { Injectable } from '@nestjs/common';

import { NginxService } from '@app/unraid-api/nginx/nginx.service.js';
import { ModificationEffect } from '@app/unraid-api/unraid-file-modifier/file-modification.js';

@Injectable()
export class FileModificationEffectService {
    constructor(private readonly nginxService: NginxService) {}
    async runEffect(effect: ModificationEffect): Promise<void> {
        switch (effect) {
            case 'nginx:reload':
                await this.nginxService.reload();
                break;
        }
    }
}
