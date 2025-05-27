import { Logger } from '@nestjs/common';
import { readFile, rm, writeFile } from 'node:fs/promises';

import { fileExists } from '@app/core/utils/files/file-exists.js';
import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification.js';

export default class LogViewerModification extends FileModification {
    id: string = 'log-viewer';
    public readonly filePath: string =
        '/usr/local/emhttp/plugins/dynamix.my.servers/LogViewer.page' as const;

    private readonly logViewerConfig: string = `
Menu="UNRAID-OS"
Title="Log Viewer (new)"
Icon="icon-log"
Tag="list"
---
<unraid-i18n-host>
  <unraid-log-viewer></unraid-log-viewer>
</unraid-i18n-host> 

`.trimStart();

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
            this.logViewerConfig
        );
    }

    async shouldApply(): Promise<ShouldApplyWithReason> {
        if (await this.isUnraidVersionGreaterThanOrEqualTo('7.2.0')) {
            return {
                shouldApply: false,
                reason: 'Skipping for Unraid 7.2 or later, where the Unraid API is integrated.',
            };
        }
        const alreadyConfigured = await fileExists(this.filePath);
        if (alreadyConfigured) {
            return { shouldApply: false, reason: 'LogViewer configuration already exists' };
        }
        return { shouldApply: true, reason: 'No LogViewer config for the API configured yet' };
    }

    async apply(): Promise<string> {
        await this.rollback();
        await writeFile(this.filePath, this.logViewerConfig, { mode: 0o644 });
        return this.logViewerConfig;
    }

    async rollback(): Promise<void> {
        await rm(this.getPathToAppliedPatch(), { force: true });
        await rm(this.filePath, { force: true });
    }
}
