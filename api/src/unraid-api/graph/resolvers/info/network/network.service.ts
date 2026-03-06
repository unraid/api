import { Injectable } from '@nestjs/common';

import { networkInterfaces } from 'systeminformation';

import { getters } from '@app/store/index.js';
import { InfoNetworkInterface } from '@app/unraid-api/graph/resolvers/info/network/network.model.js';

@Injectable()
export class NetworkService {
    async getNetworkInterfaces(): Promise<InfoNetworkInterface[]> {
        // We get runtime status (MAC, current IP, link state) from systeminformation
        // This provides the "as-is" state of the server.
        const sysInfo = await networkInterfaces();

        return sysInfo.map((iface) => {
            return {
                id: `info/network/${iface.iface}`,
                name: iface.iface,
                description: iface.ifaceName, // Label
                macAddress: iface.mac,
                status: iface.operstate,
                protocol: iface.ip4 ? (iface.ip6 ? 'ipv4+ipv6' : 'ipv4') : iface.ip6 ? 'ipv6' : 'none',
                ipAddress: iface.ip4,
                netmask: iface.ip4subnet,
                gateway: 'unknown',
                useDhcp: iface.dhcp,
                ipv6Address: iface.ip6,
                ipv6Netmask: iface.ip6subnet,
                useDhcp6: false,
            } as InfoNetworkInterface;
        });
    }

    /**
     * Get the primary management IP address (usually webgui listener)
     */
    async getManagementInterface(): Promise<InfoNetworkInterface | null> {
        // Try to find br0, then eth0, then whatever has an IP
        const sysInfo = await networkInterfaces();

        // Priority list
        const priority = ['br0', 'eth0', 'bond0'];

        let primary = sysInfo.find((info) => priority.includes(info.iface));

        if (!primary) {
            // Find first non-loopback with IPv4
            primary = sysInfo.find((info) => !info.internal && info.ip4);
        }

        if (!primary) return null;

        return {
            id: `info/network/primary`,
            name: primary.iface,
            macAddress: primary.mac,
            ipAddress: primary.ip4,
            netmask: primary.ip4subnet,
            useDhcp: primary.dhcp,
            ipv6Address: primary.ip6,
        } as InfoNetworkInterface;
    }
}
