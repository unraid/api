import { existsSync } from 'node:fs';

import { execa } from 'execa';

/**
 * Local filesystem and env checks stay synchronous so we can branch at module load.
 * @returns True if the Connect Unraid plugin is installed, false otherwise.
 */
export const isConnectPluginInstalled = () => {
    if (process.env.SKIP_CONNECT_PLUGIN_CHECK === 'true') {
        return true;
    }
    return existsSync('/boot/config/plugins/dynamix.unraid.net.plg');
};

/**
 * Prune the stale connect plugin entry, if necessary.
 *
 * No-op's if invoked while the plugin is installed.
 * @param shouldRestart Whether to restart the api after pruning.
 */
export async function pruneStaleConnectPluginEntryIfNecessary({
    shouldRestart = false,
}: { shouldRestart?: boolean } = {}) {
    if (isConnectPluginInstalled()) {
        return;
    }

    let removalCommand = 'unraid-api plugins remove -b unraid-api-plugin-connect';
    if (!shouldRestart) {
        removalCommand += ' --no-restart';
    }
    return await execa('unraid-api', removalCommand.split(' ').slice(1), {
        shell: 'bash',
        extendEnv: true,
    });
}
