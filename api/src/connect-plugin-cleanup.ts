import { existsSync } from 'node:fs';

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
