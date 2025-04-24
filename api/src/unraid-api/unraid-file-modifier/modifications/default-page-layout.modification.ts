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

    private prependDoctypeWithPhp(source: string, phpToAdd: string): string {
        // The regex to find the target string `?>\s*<!DOCTYPE html>` at the beginning of a line
        const targetRegex = /^\?>\s*<!DOCTYPE html>/m;

        // Prepend the phpToAdd before the matched string
        return source.replace(targetRegex, (match) => `${phpToAdd}\n${match}`);
    }

    private patchGuiBootAuth(source: string): string {
        // prettier-ignore
        const newPhpCode =
`
if (session_status() == PHP_SESSION_NONE) {
  session_start();
  $_SESSION['unraid_login'] = time();
  $_SESSION['unraid_user'] = 'root';
  session_regenerate_id(true);
  session_write_close();
  # This situation should only be possible when booting into GUI mode
  my_logger("Page accessed without session; created session for root user.");
}`;
        // Add the PHP code before the DOCTYPE declaration
        return this.prependDoctypeWithPhp(source, newPhpCode);
    }

    private applyToSource(fileContent: string): string {
        const transformers = [
            this.removeNotificationBell.bind(this),
            this.replaceToasts.bind(this),
            this.addToaster.bind(this),
            this.patchGuiBootAuth.bind(this),
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
