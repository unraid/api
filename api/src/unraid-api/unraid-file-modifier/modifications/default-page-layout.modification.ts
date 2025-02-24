import type { Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';

import { createPatch } from 'diff';

import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification.js';

export default class DefaultPageLayoutModification extends FileModification {
    id: string = 'default-page-layout';
    public readonly filePath: string = '/usr/local/emhttp/plugins/dynamix/include/DefaultPageLayout.php';

    private addToaster(source: string): string {
        if (source.includes('unraid-toaster')) {
            return source;
        }
        const insertion = `<uui-toaster rich-colors close-button position="<?= ($notify['position'] === 'center') ? 'top-center' : $notify['position'] ?>"></uui-toaster>`;
        return source.replace(/<\/body>/, `${insertion}\n</body>`);
    }

    private removeNotificationBell(source: string): string {
        return source.replace(/^.*(id='bell'|#bell).*$/gm, '');
    }

    private replaceToasts(source: string): string {
        // matches jgrowl calls up to the second `)};`
        const jGrowlPattern =
            /\$\.jGrowl\(notify\.subject\+'<br>'\+notify\.description,\s*\{(?:[\s\S]*?\}\);[\s\S]*?)}\);/g;

        return source.replace(jGrowlPattern, '');
    }

    private applyToSource(fileContent: string): string {
        const transformers = [
            this.removeNotificationBell.bind(this),
            this.replaceToasts.bind(this),
            this.addToaster.bind(this),
        ];
        return transformers.reduce((content, fn) => fn(content), fileContent);
    }

    protected async generatePatch(overridePath?: string): Promise<string> {
        const fileContent = await readFile(this.filePath, 'utf-8');

        const newContent = this.applyToSource(fileContent);

        return this.createPatchWithDiff(overridePath ?? this.filePath, fileContent, newContent);
    }

    async shouldApply(): Promise<ShouldApplyWithReason> {
        return {
            shouldApply: true,
            reason: 'Always apply the allowed file changes to ensure compatibility.',
        };
    }
}
