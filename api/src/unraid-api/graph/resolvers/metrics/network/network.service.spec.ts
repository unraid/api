import { readFile } from 'fs/promises';

import { networkInterfaces, networkStats, Systeminformation } from 'systeminformation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NetworkMetricsService } from '@app/unraid-api/graph/resolvers/metrics/network/network.service.js';

vi.mock('fs/promises', () => ({
    readFile: vi.fn(),
}));

vi.mock('systeminformation', () => ({
    networkInterfaces: vi.fn(),
    networkStats: vi.fn(),
}));

describe('NetworkMetricsService', () => {
    let service: NetworkMetricsService;

    beforeEach(() => {
        service = new NetworkMetricsService();
        vi.resetAllMocks();
    });

    it('maps network stats and packet counters to GraphQL metrics', async () => {
        vi.mocked(networkStats).mockResolvedValue([
            {
                iface: 'eth0',
                operstate: 'up',
                rx_bytes: 1024,
                tx_bytes: 2048,
                rx_dropped: 1,
                tx_dropped: 2,
                rx_errors: 3,
                tx_errors: 4,
                rx_sec: 100,
                tx_sec: 200,
                ms: 2000,
            },
        ] satisfies Systeminformation.NetworkStatsData[]);
        vi.mocked(networkInterfaces).mockResolvedValue([
            {
                iface: 'eth0',
                speed: 1000,
            },
        ] as Systeminformation.NetworkInterfacesData[]);
        vi.mocked(readFile).mockResolvedValueOnce('10\n').mockResolvedValueOnce('20\n');

        const result = await service.getNetworkMetrics();

        expect(result).toEqual([
            expect.objectContaining({
                id: 'metrics/network/eth0',
                name: 'eth0',
                operstate: 'up',
                bytesReceived: 1024,
                bytesSent: 2048,
                packetsReceived: 10,
                packetsSent: 20,
                receiveDropped: 1,
                transmitDropped: 2,
                receiveErrors: 3,
                transmitErrors: 4,
                rxSec: 100,
                txSec: 200,
                utilizationPercent: 0.00024,
            }),
        ]);
        expect(result[0].lastUpdated).toBeInstanceOf(Date);
    });

    it('falls back to zero packet counters and undefined utilization when speed is missing', async () => {
        vi.mocked(networkStats).mockResolvedValue([
            {
                iface: 'br0',
                operstate: 'unknown',
                rx_bytes: 0,
                tx_bytes: 0,
                rx_dropped: 0,
                tx_dropped: 0,
                rx_errors: 0,
                tx_errors: 0,
                rx_sec: 0,
                tx_sec: 0,
                ms: 2000,
            },
        ] satisfies Systeminformation.NetworkStatsData[]);
        vi.mocked(networkInterfaces).mockResolvedValue([
            {
                iface: 'br0',
                speed: null,
            },
        ] as Systeminformation.NetworkInterfacesData[]);
        vi.mocked(readFile).mockRejectedValue(new Error('not available'));

        const result = await service.getNetworkMetrics();

        expect(result[0]).toEqual(
            expect.objectContaining({
                packetsReceived: 0,
                packetsSent: 0,
                utilizationPercent: undefined,
            })
        );
    });
});
