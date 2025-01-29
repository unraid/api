import { Logger } from '@nestjs/common';
import { rm, writeFile } from 'node:fs/promises';

import { execa } from 'execa';

import { fileExists } from '@app/core/utils/misc/parse-config';
import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/unraid-file-modifier.service';

export class LogRotateModification implements FileModification {
    id: string = 'log-rotate';
    filePath: string = '/etc/logrotate.d/unraid-api' as const;
    logger: Logger;
    logRotateConfig: string = `
/var/log/unraid-api/*.log {
    rotate 1
    missingok
    size 1M
    su root root
    compress
    delaycompress
    copytruncate
    create 0640 root root
}
    `;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    async apply(): Promise<void> {
        await writeFile(this.filePath, this.logRotateConfig, { mode: '644' });
        // Ensure file is owned by root:root
        await execa('chown', ['root:root', this.filePath]).catch((err) => this.logger.error(err));
    }

    async rollback(): Promise<void> {
        await rm(this.filePath);
    }

    async shouldApply(): Promise<ShouldApplyWithReason> {
        const alreadyConfigured = await fileExists(this.filePath);
        if (alreadyConfigured) {
            return { shouldApply: false, reason: 'LogRotate configuration already exists' };
        }
        return { shouldApply: true, reason: 'No LogRotate config for the API configured yet' };
    }
}
