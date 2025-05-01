import type { Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';

import { createPatch } from 'diff';

import isGuiMode from '@app/core/utils/validation/is-gui-mode.js';
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
        const targetRegex = /^\s*\?>\s*<!DOCTYPE html>/m;

        // Prepend the phpToAdd before the matched string
        return source.replace(targetRegex, (match) => `${phpToAdd}\n${match}`);
    }

    private async patchGuiBootAuth(source: string): Promise<string> {
        if (source.includes('if (is_localhost() && !is_good_session())')) {
            return source;
        }
        // prettier-ignore
        const newPhpCode =
`
function is_localhost() {
  // Use the peer IP, not the Host header which can be spoofed
  return $_SERVER['REMOTE_ADDR'] === '127.0.0.1' || $_SERVER['REMOTE_ADDR'] === '::1';
}
function is_good_session() {
  return isset($_SESSION) && isset($_SESSION['unraid_user']) && isset($_SESSION['unraid_login']);
}
if (is_localhost() && !is_good_session()) {
  if (session_status() === PHP_SESSION_ACTIVE) {
    session_destroy();
  }
  session_start();
  $_SESSION['unraid_login'] = time();
  $_SESSION['unraid_user'] = 'root';
  session_write_close();
  my_logger("Unraid GUI-boot: created root session for localhost request.");
}`;
        // Add the PHP code before the DOCTYPE declaration
        return this.prependDoctypeWithPhp(source, newPhpCode);
    }

    private async applyToSource(fileContent: string): Promise<string> {
        const transformers = [
            this.removeNotificationBell.bind(this),
            this.replaceToasts.bind(this),
            this.addToaster.bind(this),
            this.patchGuiBootAuth.bind(this),
        ];

        return transformers.reduce(async (contentPromise, transformer) => {
            const content = await contentPromise;
            return transformer(content);
        }, Promise.resolve(fileContent));
    }

    protected async generatePatch(overridePath?: string): Promise<string> {
        const fileContent = await readFile(this.filePath, 'utf-8');

        const newContent = await this.applyToSource(fileContent);

        return this.createPatchWithDiff(overridePath ?? this.filePath, fileContent, newContent);
    }

    async shouldApply(): Promise<ShouldApplyWithReason> {
        return {
            shouldApply: true,
            reason: 'Always apply the allowed file changes to ensure compatibility.',
        };
    }
}
