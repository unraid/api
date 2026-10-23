import EventEmitter from 'node:events';

import type { ISsdp, SsdpEmitter } from '@runonflux/nat-upnp';
import { Client, Device } from '@runonflux/nat-upnp';
import { describe, expect, it } from 'vitest';

const DEVICE_TYPE = 'urn:schemas-upnp-org:device:InternetGatewayDevice:1';
const COMPRESSED_GATEWAY = '2001:db8::1';
const EXPANDED_GATEWAY = '2001:0db8:0:0:0:0:0:1';

const createSsdp = (locationAddress: string, gatewayAddress: string): ISsdp => ({
    search: () => {
        const emitter = new EventEmitter() as SsdpEmitter;
        queueMicrotask(() =>
            emitter.emit(
                'device',
                {
                    location: `http://[${locationAddress}]/root.xml`,
                    st: DEVICE_TYPE,
                },
                gatewayAddress,
                '192.0.2.2'
            )
        );
        return emitter;
    },
    close: () => undefined,
});

describe('nat-upnp IPv6 address matching', () => {
    it('accepts equivalent IPv6 forms in the gateway allow-list', async () => {
        const client = new Client({
            gatewayAddresses: [EXPANDED_GATEWAY],
            ssdp: createSsdp(COMPRESSED_GATEWAY, COMPRESSED_GATEWAY),
            timeout: 100,
        });

        await expect(client.getGateway()).resolves.toMatchObject({
            gatewayAddress: COMPRESSED_GATEWAY,
        });
        client.close();
    });

    it('accepts equivalent IPv6 forms in the device address check', () => {
        expect(
            () =>
                new Device(`http://[${EXPANDED_GATEWAY}]/root.xml`, {
                    allowedAddress: COMPRESSED_GATEWAY,
                })
        ).not.toThrow();
    });
});
