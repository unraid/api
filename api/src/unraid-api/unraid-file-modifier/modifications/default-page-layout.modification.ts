import type { Logger } from '@nestjs/common';
import { readFile, writeFile } from 'node:fs/promises';

import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/unraid-file-modifier.service';
import { backupFile, restoreFile } from '@app/utils';

export default class DefaultPageLayoutModification implements FileModification {
    id: string = 'DefaultPageLayout.php';
    logger: Logger;
    filePath: string = '/usr/local/emhttp/plugins/dynamix/include/DefaultPageLayout.php';
    constructor(logger: Logger) {
        this.logger = logger;
    }

    async apply(): Promise<void> {
        await backupFile(this.filePath, true);
        const fileContent = await readFile(this.filePath, 'utf-8');
        await writeFile(this.filePath, DefaultPageLayoutModification.applyToSource(fileContent));
        this.logger.log(`${this.id} replaced successfully.`);
    }

    async rollback(): Promise<void> {
        const restored = await restoreFile(this.filePath, false);
        if (restored) {
            this.logger.debug(`${this.id} restored.`);
        } else {
            this.logger.warn(`Could not restore ${this.id}`);
        }
    }

    async shouldApply(): Promise<ShouldApplyWithReason> {
        return {
            shouldApply: true,
            reason: 'Always apply the allowed file changes to ensure compatibility.',
        };
    }

    static applyToSource(fileContent: string): string {
        const transformers = [
            DefaultPageLayoutModification.removeNotificationBell,
            DefaultPageLayoutModification.replaceToasts,
            DefaultPageLayoutModification.addToaster,
        ];
        return transformers.reduce((content, fn) => fn(content), fileContent);
    }

    static addToaster(source: string): string {
        const insertion = `<unraid-toaster rich-colors close-button position="<?= ($notify['position'] === 'center') ? 'top-center' : $notify['position'] ?>"></unraid-toaster>`;
        return source.replace(/<\/body>/, `${insertion}</body>`);
    }

    static removeNotificationBell(source: string): string {
        return source.replace(/^.*(id='bell'|#bell).*$/gm, '');
    }

    static replaceToasts(source: string): string {
        // matches jgrowl calls up to the second `)};`
        const jGrowlPattern =
            /\$\.jGrowl\(notify\.subject\+'<br>'\+notify\.description,\s*\{(?:[\s\S]*?\}\);[\s\S]*?)}\);/g;

        return source.replace(jGrowlPattern, '');
    }
}
