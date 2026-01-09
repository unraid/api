import { readFile } from 'node:fs/promises';

import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification.js';

export default class NotifyPhpModification extends FileModification {
    id: string = 'notify-php';
    public readonly filePath: string = '/usr/local/emhttp/plugins/dynamix/include/Notify.php';

    async shouldApply(): Promise<ShouldApplyWithReason> {
        // Skip for 7.4+
        if (await this.isUnraidVersionGreaterThanOrEqualTo('7.4.0')) {
            return {
                shouldApply: false,
                reason: 'Refactored Notify.php is natively available in Unraid 7.4+',
            };
        }
        // Base logic checks file existence etc. We disable the default 7.2 check.
        return super.shouldApply({ checkOsVersion: false });
    }

    protected async generatePatch(overridePath?: string): Promise<string> {
        const fileContent = await readFile(this.filePath, 'utf-8');

        // Regex explanation:
        // Group 1: Cases e, s, d, i, m
        // Group 2: Cases x, t
        // Group 3: original body ($notify .= ...) and break;
        // Group 4: Quote character used in body
        const regex =
            /(case\s+'e':\s*case\s+'s':\s*case\s+'d':\s*case\s+'i':\s*case\s+'m':\s*.*?break;)(\s*case\s+'x':\s*case\s+'t':)\s*(\$notify\s*\.=\s*(["'])\s*-\{\$option\}\4;\s*break;)/s;

        const newContent = fileContent.replace(
            regex,
            `$1
    case 'u':
      $notify .= " -{$option} ".escapeshellarg($value);
      break;
    $2
      $3`
        );

        return this.createPatchWithDiff(overridePath ?? this.filePath, fileContent, newContent);
    }
}
