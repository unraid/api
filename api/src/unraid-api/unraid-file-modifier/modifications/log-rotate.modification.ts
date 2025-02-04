import { Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';

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

    protected async generatePatch(overridePath?: string): Promise<string> {
        const currentContent = (await fileExists(this.filePath))
            ? await readFile(this.filePath, 'utf8')
            : '';

        return this.createPatchWithDiff(
            overridePath ?? this.filePath,
            currentContent,
            this.logRotateConfig
        );
    }

    async shouldApply(): Promise<ShouldApplyWithReason> {
        const alreadyConfigured = await fileExists(this.filePath);
        if (alreadyConfigured) {
            return { shouldApply: false, reason: 'LogRotate configuration already exists' };
        }
        return { shouldApply: true, reason: 'No LogRotate config for the API configured yet' };
    }
}
