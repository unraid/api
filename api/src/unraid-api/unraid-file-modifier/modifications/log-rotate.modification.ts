import { Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';

import { createPatch } from 'diff';
import { execa } from 'execa';

import { fileExists } from '@app/core/utils/files/file-exists';
import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification';

export class LogRotateModification extends FileModification {
    id: string = 'log-rotate';
    public readonly filePath: string = '/etc/logrotate.d/unraid-api' as const;
    private readonly logRotateConfig: string = `
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
        super(logger);
    }

    protected async generatePatch(): Promise<string> {
        const currentContent = (await fileExists(this.filePath))
            ? await readFile(this.filePath, 'utf8')
            : '';

        const patch = createPatch(
            this.filePath,
            currentContent,
            this.logRotateConfig,
            undefined,
            undefined,
            {
                context: 3,
            }
        );

        // After applying patch, ensure file permissions are correct
        await execa('chown', ['root:root', this.filePath]).catch((err) => this.logger.error(err));

        return patch;
    }

    async shouldApply(): Promise<ShouldApplyWithReason> {
        const alreadyConfigured = await fileExists(this.filePath);
        if (alreadyConfigured) {
            return { shouldApply: false, reason: 'LogRotate configuration already exists' };
        }
        return { shouldApply: true, reason: 'No LogRotate config for the API configured yet' };
    }
}
