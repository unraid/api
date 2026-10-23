import { describe, expect, it } from 'vitest';

import { parseDefaultGatewayAddresses } from '@app/upnp/default-gateway.js';

describe('parseDefaultGatewayAddresses', () => {
    it('extracts unique IPv4 and IPv6 default gateways', () => {
        const output = [
            'default via 192.168.1.1 dev eth0 proto dhcp src 192.168.1.50 metric 100',
            'default via fe80::1 dev eth0 proto ra metric 1024',
            'default via 192.168.1.1 dev eth1 metric 200',
        ].join('\n');

        expect(parseDefaultGatewayAddresses(output)).toEqual(['192.168.1.1', 'fe80::1']);
    });

    it('ignores routes without a gateway and invalid gateway values', () => {
        const output = [
            'default dev eth0 scope link',
            'default via not-an-ip dev eth1',
            '10.0.0.0/8 via 10.0.0.1 dev eth0',
        ].join('\n');

        expect(parseDefaultGatewayAddresses(output)).toEqual([]);
    });
});
