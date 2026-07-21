import { describe, expect, it } from 'vitest';

import { isPrivateIp } from '../connection-status/is-private-ip.js';

describe('isPrivateIp', () => {
    it.each(['10.1.2.3', '172.16.5.5', '192.168.1.1', '127.0.0.1', '169.254.1.1'])(
        'returns true for private/loopback/link-local IPv4 %s',
        (address) => {
            expect(isPrivateIp(address)).toBe(true);
        }
    );

    it.each(['::1', 'fd12::1', 'fe80::1'])('returns true for private/loopback IPv6 %s', (address) => {
        expect(isPrivateIp(address)).toBe(true);
    });

    it.each(['8.8.8.8', '1.1.1.1', '172.32.0.1', '2606:4700::1111'])(
        'returns false for public IP %s',
        (address) => {
            expect(isPrivateIp(address)).toBe(false);
        }
    );

    it.each(['not-an-ip', '', undefined, null])('returns false for non-IP input %s', (address) => {
        expect(isPrivateIp(address)).toBe(false);
    });
});
