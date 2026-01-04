import { readFile } from 'node:fs/promises';

import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification.js';

export default class TranslationsPhpModification extends FileModification {
    id: string = 'translations-php';
    public readonly filePath: string = '/usr/local/emhttp/plugins/dynamix/include/Translations.php';

    async shouldApply(): Promise<ShouldApplyWithReason> {
        // Skip for 7.4+
        if (await this.isUnraidVersionGreaterThanOrEqualTo('7.4.0')) {
            return {
                shouldApply: false,
                reason: 'Refactored Translations.php caching logic is natively available in Unraid 7.4+',
            };
        }
        return super.shouldApply();
    }

    protected async generatePatch(overridePath?: string): Promise<string> {
        const fileContent = await readFile(this.filePath, 'utf-8');

        // Regex for $store cache check (Global translations, Additional URI translations, and parse_plugin)
        // Matches: if (!file_exists($store)) file_put_contents($store,serialize(parse_lang_file($text)));
        const storeRegex =
            /if\s*\(!file_exists\(\$store\)\)\s*file_put_contents\(\$store,serialize\(parse_lang_file\(\$text\)\)\);/g;

        // Regex for $help cache check (Help text)
        // Matches: if (!file_exists($help)) file_put_contents($help,serialize(parse_help_file($root)));
        const helpRegex =
            /if\s*\(!file_exists\(\$help\)\)\s*file_put_contents\(\$help,serialize\(parse_help_file\(\$root\)\)\);/g;

        let newContent = fileContent.replace(
            storeRegex,
            'if (!file_exists($store) || filemtime($text) > filemtime($store)) file_put_contents($store,serialize(parse_lang_file($text)));'
        );

        newContent = newContent.replace(
            helpRegex,
            'if (!file_exists($help) || filemtime($root) > filemtime($help)) file_put_contents($help,serialize(parse_help_file($root)));'
        );

        return this.createPatchWithDiff(overridePath ?? this.filePath, fileContent, newContent);
    }
}
