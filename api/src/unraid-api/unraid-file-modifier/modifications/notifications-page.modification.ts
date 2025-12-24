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

        const newContent = NotificationsPageModification.applyToSource(fileContent);

        return this.createPatchWithDiff(overridePath ?? this.filePath, fileContent, newContent);
    }

    private static applyToSource(fileContent: string): string {
        let newContent = fileContent
            // Remove lines between _(Date format)_: and :notifications_date_format_help:
            .replace(/^\s*_\(Date format\)_:(?:[^\n]*\n)*?\s*:notifications_date_format_help:/gm, '')
            // Remove lines between _(Time format)_: and :notifications_time_format_help:
            .replace(/^\s*_\(Time format\)_:(?:[^\n]*\n)*?\s*:notifications_time_format_help:/gm, '');

        // Add bottom-center and top-center position options if not present
        const positionSelectStart = '<select name="position">';
        const positionSelectEnd = '</select>';
        const bottomCenterOption =
            '  <?=mk_option($notify[\'position\'], "bottom-center", _("bottom-center"))?>';
        const topCenterOption = '  <?=mk_option($notify[\'position\'], "top-center", _("top-center"))?>';

        if (newContent.includes(positionSelectStart) && !newContent.includes(bottomCenterOption)) {
            newContent = newContent.replace(
                '<?=mk_option($notify[\'position\'], "bottom-right", _("bottom-right"))?>',
                '<?=mk_option($notify[\'position\'], "bottom-right", _("bottom-right"))?>\n' +
                    bottomCenterOption +
                    '\n' +
                    topCenterOption
            );
        }

        // Add Stack/Duration/Max settings
        const helpAnchor = ':notifications_display_position_help:';
        const newSettings = `
:
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
