import { getters } from '@app/store/index.js';

/**
 * Returns the LAN IPv4 address reported by emhttp, if available.
 */
export function getLanIp(): string {
    const emhttp = getters.emhttp();
    const lanFromNetworks = emhttp?.networks?.[0]?.ipaddr?.[0];
    if (lanFromNetworks) {
        return lanFromNetworks;
    }

    const lanFromNginx = emhttp?.nginx?.lanIp;
    if (lanFromNginx) {
        return lanFromNginx;
    }

    return '';
}
