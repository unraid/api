import { Injectable } from '@nestjs/common';

import { networkInterfaces } from 'systeminformation';

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
                mtu: iface.mtu ?? undefined,
                speed: iface.speed ?? undefined,
                duplex: iface.duplex,
                internal: iface.internal,
                virtual: iface.virtual,
                operstate: iface.operstate,
                type: iface.type,
                vlanId: this.parseVlanId(iface.iface),
                ipv4Addresses: iface.ip4
                    ? [
                          {
                              address: iface.ip4,
                              netmask: iface.ip4subnet,
                          },
                      ]
                    : [],
                ipv6Addresses: iface.ip6
                    ? [
                          {
                              address: iface.ip6,
                              prefixLength: this.parseIpv6PrefixLength(iface.ip6subnet),
                          },
                      ]
                    : [],
                status: iface.operstate,
                protocol: iface.ip4 ? (iface.ip6 ? 'ipv4+ipv6' : 'ipv4') : iface.ip6 ? 'ipv6' : 'none',
                ipAddress: iface.ip4,
                netmask: iface.ip4subnet,
                gateway: 'unknown',
                useDhcp: iface.dhcp,
                ipv6Address: iface.ip6,
                ipv6Netmask: iface.ip6subnet,
                useDhcp6: false,
            } satisfies InfoNetworkInterface;
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
            ipv4Addresses: primary.ip4
                ? [
                      {
                          address: primary.ip4,
                          netmask: primary.ip4subnet,
                      },
                  ]
                : [],
            ipv6Addresses: primary.ip6
                ? [
                      {
                          address: primary.ip6,
                          prefixLength: this.parseIpv6PrefixLength(primary.ip6subnet),
                      },
                  ]
                : [],
        } satisfies InfoNetworkInterface;
    }

    private parseVlanId(iface: string): number | undefined {
        const match = iface.match(/\.(\d+)$/);
        if (!match) return undefined;

        const vlanId = Number(match[1]);
        return Number.isInteger(vlanId) ? vlanId : undefined;
    }

    private parseIpv6PrefixLength(subnet: string): number | undefined {
        const trimmed = subnet.trim();
        if (!/^\d+$/.test(trimmed)) return undefined;

        const parsed = Number(trimmed);
        return Number.isInteger(parsed) && parsed >= 0 && parsed <= 128 ? parsed : undefined;
    }
}
