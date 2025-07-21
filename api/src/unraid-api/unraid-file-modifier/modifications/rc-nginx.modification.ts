import { readFile } from 'fs/promises';

import { fileExists } from '@app/core/utils/files/file-exists.js';
import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification.js';

/**
 * Patch rc.nginx on < Unraid 7.2.0 to read the updated connect & api config files
 *
 * Backport of https://github.com/unraid/webgui/pull/2269
 */
export default class RcNginxModification extends FileModification {
    public filePath: string = '/etc/rc.d/rc.nginx' as const;
    id: string = 'rc-nginx';

    /**
     * Generate a patch for the rc.nginx file
     *
     * Should result in the same patch as
     * https://patch-diff.githubusercontent.com/raw/unraid/webgui/pull/2269.patch
     *
     * @param overridePath - The path to override the default file path
     * @returns The patch for the rc.nginx file
     */
    protected async generatePatch(overridePath?: string): Promise<string> {
        if (!(await fileExists(this.filePath))) {
            throw new Error(`File ${this.filePath} not found.`);
        }
        const fileContent = await readFile(this.filePath, 'utf8');
        if (!fileContent.includes('MYSERVERS=')) {
            throw new Error(`MYSERVERS not found in the file; incorrect target?`);
        }

        let newContent = fileContent.replace(
            'MYSERVERS="/boot/config/plugins/dynamix.my.servers/myservers.cfg"',
            `CONNECT_CONFIG="/boot/config/plugins/dynamix.my.servers/configs/connect.json"
API_UTILS="/usr/local/share/dynamix.unraid.net/scripts/api_utils.sh"`
        );

        if (!newContent.includes('check_remote_access()')) {
            newContent = newContent.replace(
                '# create listening ports',
                `# check if remote access should be enabled
check_remote_access(){
  # Check if connect plugin is enabled using api_utils.sh
  if [[ -f $API_UTILS ]] && $API_UTILS is_api_plugin_enabled "unraid-api-plugin-connect"; then
    # Plugin is enabled, check connect.json configuration
    if [[ -f $CONNECT_CONFIG ]] && command -v jq >/dev/null 2>&1; then
      local wanaccess=$(jq -r '.wanaccess' "$CONNECT_CONFIG" 2>/dev/null)
      local username=$(jq -r '.username' "$CONNECT_CONFIG" 2>/dev/null)
      # Enable remote access if wanaccess is true and username is not empty
      if [[ $wanaccess == "true" && -n $username && $username != "null" ]]; then
        return 0
      fi
    fi
  fi
  return 1
}

# create listening ports`
            );
        }

        newContent = newContent.replace(
            `if [[ -L /usr/local/sbin/unraid-api ]] && grep -qs 'wanaccess="yes"' $MYSERVERS && ! grep -qs 'username=""' $MYSERVERS; then`,
            `if [[ -L /usr/local/sbin/unraid-api ]] && check_remote_access; then`
        );

        newContent = newContent.replace(
            'for NET in ${!NET_FQDN6[@]}; do',
            'for NET in "${!NET_FQDN6[@]}"; do'
        );
        newContent = newContent.replace(
            'for NET in ${!NET_FQDN[@]}; do',
            'for NET in "${!NET_FQDN[@]}"; do'
        );

        // Add robots.txt Access-Control-Allow-Origin header if not already present
        if (!newContent.includes('#robots.txt any origin')) {
            newContent = newContent.replace(
                'location = /robots.txt {',
                // prettier-ignore
                `location = /robots.txt {
\t    add_header Access-Control-Allow-Origin *; #robots.txt any origin`
            );
        }

        return this.createPatchWithDiff(overridePath ?? this.filePath, fileContent, newContent);
    }

    async shouldApply(): Promise<ShouldApplyWithReason> {
        if (await this.isUnraidVersionGreaterThanOrEqualTo('7.2.0')) {
            return {
                shouldApply: false,
                reason: 'Patch unnecessary for Unraid 7.2 or later because the Unraid API is integrated.',
            };
        }
        const { shouldApply, reason } = await super.shouldApply();
        return {
            shouldApply: shouldApply,
            reason: shouldApply ? 'Unraid version is less than 7.2.0, applying the patch.' : reason,
            effects: ['nginx:reload'],
        };
    }
}
