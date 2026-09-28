import { BlockList, isIP } from 'node:net';

const privateIpRanges = new BlockList();
privateIpRanges.addSubnet('10.0.0.0', 8, 'ipv4');
privateIpRanges.addSubnet('172.16.0.0', 12, 'ipv4');
privateIpRanges.addSubnet('192.168.0.0', 16, 'ipv4');
privateIpRanges.addSubnet('127.0.0.0', 8, 'ipv4');
privateIpRanges.addSubnet('169.254.0.0', 16, 'ipv4');
privateIpRanges.addSubnet('fc00::', 7, 'ipv6');
privateIpRanges.addSubnet('fe80::', 10, 'ipv6');
privateIpRanges.addAddress('::1', 'ipv6');

/**
 * Returns true when `address` is a private, loopback, or link-local IP.
 * Replaces the unmaintained `ip` package's `isPrivate`; non-IP input is treated as not private.
 */
export const isPrivateIp = (address: string | undefined | null): boolean => {
    if (!address) {
        return false;
    }
    const family = isIP(address);
    if (family === 0) {
        return false;
    }
    return privateIpRanges.check(address, family === 4 ? 'ipv4' : 'ipv6');
};
