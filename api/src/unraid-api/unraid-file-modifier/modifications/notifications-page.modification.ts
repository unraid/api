import { readFile } from 'node:fs/promises';

import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification.js';

export default class NotificationsPageModification extends FileModification {
    id: string = 'notifications-page';
    public readonly filePath: string = '/usr/local/emhttp/plugins/dynamix/Notifications.page';

    async shouldApply(): Promise<ShouldApplyWithReason> {
        // Skip for 7.4+
        if (await this.isUnraidVersionGreaterThanOrEqualTo('7.4.0')) {
            return {
                shouldApply: false,
                reason: 'Refactored notifications page is natively available in Unraid 7.4+',
            };
        }
        return super.shouldApply({ checkOsVersion: false });
    }

    protected async generatePatch(overridePath?: string): Promise<string> {
        const fileContent = await readFile(this.filePath, 'utf-8');
        const isBelow71 = !(await this.isUnraidVersionGreaterThanOrEqualTo('7.1.0'));

        const newContent = NotificationsPageModification.applyToSource(fileContent, isBelow71);

        return this.createPatchWithDiff(overridePath ?? this.filePath, fileContent, newContent);
    }

    private static applyToSource(fileContent: string, removeAutoClose: boolean): string {
        let newContent = fileContent
            // Remove lines between _(Date format)_: and :notifications_date_format_help:
            .replace(/^\s*_\(Date format\)_:(?:[^\n]*\n)*?\s*:notifications_date_format_help:/gm, '')
            // Remove lines between _(Time format)_: and :notifications_time_format_help:
            .replace(/^\s*_\(Time format\)_:(?:[^\n]*\n)*?\s*:notifications_time_format_help:/gm, '');

        if (removeAutoClose) {
            // Remove _(Auto-close)_ section
            // Looks like:
            // _(Auto-close)_ (_(seconds)_):
            // : <input type="number" name="life" class="a" min="0" max="60" value="<?=$notify['life']?>"> _(a value of zero means no automatic closure)_
            //
            // :notifications_auto_close_help:
            newContent = newContent.replace(
                /^\s*_\(Auto-close\)_ \(?_\(seconds\)_?\)?:\s*\n\s*:\s*<input[^>]+>.*?\n\s*\n\s*:notifications_auto_close_help:\s*/gm,
                ''
            );

            // Try generic regex if the detailed one fails/is too brittle, but specific is better for safety
            // Let's rely on the anchor strings
            const autoCloseAnchor = '_((Auto-close))_ (_((seconds))_):';
            // Since regex with multiple lines and potential slight variations is better handled loosely or with concrete bounds
            // Let's use a simpler approach if the specific one is tricky without seeing exact whitespace chars
            // The user provided snippet has:
            // _(Auto-close)_ (_(seconds)_):
            // : <input type="number" name="life" class="a" min="0" max="60" value="<?=$notify['life']?>"> _(a value of zero means no automatic closure)_
            //
            // :notifications_auto_close_help:

            // Using a regex that captures from start to the help tag
            newContent = newContent.replace(
                /_\(Auto-close\)_[^:]*:(?:[^\n]*\n)*?\s*:notifications_auto_close_help:/gm,
                ''
            );
        }

        // Replace "center" with "bottom-center" and "top-center"
        const centerOption = '<?=mk_option($notify[\'position\'], "center", _("center"))?>';

        if (newContent.includes(centerOption)) {
            newContent = newContent.replace(
                centerOption,
                '<?=mk_option($notify[\'position\'], "bottom-center", _("bottom-center"))?>\n' +
                    '  <?=mk_option($notify[\'position\'], "top-center", _("top-center"))?>'
            );
        }

        // Add Stack/Duration/Max settings
        const helpAnchor = ':notifications_display_position_help:';
        const newSettings = `
        
_(Stack notifications)_:
: <select name="expand">
  <?=mk_option($notify['expand'] ?? 'true', "true", _("Yes"))?>
  <?=mk_option($notify['expand'] ?? 'true', "false", _("No"))?>
  </select>

:notifications_stack_help:

_(Duration)_:
: <input type="number" name="duration" value="<?=$notify['duration'] ?? 5000?>" min="1000" step="500">

:notifications_duration_help:

_(Max notifications)_:
: <input type="number" name="max" value="<?=$notify['max'] ?? 3?>" min="1" max="10">

:notifications_max_help:
`;

        if (newContent.includes(helpAnchor)) {
            // Simple check to avoid duplicated insertion
            if (!newContent.includes('_(Stack notifications)_:')) {
                newContent = newContent.replace(helpAnchor, helpAnchor + newSettings);
            }
        }

        return newContent;
    }
}
