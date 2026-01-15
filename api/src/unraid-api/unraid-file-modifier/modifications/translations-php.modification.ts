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
        return super.shouldApply({ checkOsVersion: false });
    }

    protected async generatePatch(overridePath?: string): Promise<string> {
        // Read file using the correct path; ignoring overridePath for reading as per test suite pattern
        const fileContent = await readFile(this.filePath, 'utf-8');

        // Regex for $store/cache check (Global translations, Additional URI translations, and parse_plugin)
        // Matches structure: if (!file_exists($CACHE)) file_put_contents($CACHE,serialize(parse_lang_file($SOURCE)));
        // Uses generic variable capture ($1=cache, $2=source) to handle variable renaming (e.g. $store vs $cache)
        // and permissive whitespace matching.
        const storeRegex =
            /if\s*\(\s*!\s*file_exists\(\s*\$(\w+)\s*\)\s*\)\s*file_put_contents\(\s*\$\1\s*,\s*serialize\(\s*parse_lang_file\(\s*\$(\w+)\s*\)\s*\)\s*\);/g;

        // Regex for $help cache check (Help text)
        // Matches structure: if (!file_exists($HELP)) file_put_contents($HELP,serialize(parse_help_file($ROOT)));
        const helpRegex =
            /if\s*\(\s*!\s*file_exists\(\s*\$(\w+)\s*\)\s*\)\s*file_put_contents\(\s*\$\1\s*,\s*serialize\(\s*parse_help_file\(\s*\$(\w+)\s*\)\s*\)\s*\);/g;

        let newContent = fileContent.replace(storeRegex, (match, cacheVar, sourceVar) => {
            return `clearstatcache(); if (!file_exists($${cacheVar}) || filemtime($${sourceVar}) > filemtime($${cacheVar})) file_put_contents($${cacheVar},serialize(parse_lang_file($${sourceVar})));`;
        });

        newContent = newContent.replace(helpRegex, (match, cacheVar, sourceVar) => {
            return `clearstatcache(); if (!file_exists($${cacheVar}) || filemtime($${sourceVar}) > filemtime($${cacheVar})) file_put_contents($${cacheVar},serialize(parse_help_file($${sourceVar})));`;
        });

        return this.createPatchWithDiff(overridePath ?? this.filePath, fileContent, newContent);
    }
}
