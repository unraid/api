import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';

import { networkInterfaces, networkStats, Systeminformation } from 'systeminformation';

import { NetworkMetrics } from '@app/unraid-api/graph/resolvers/metrics/network/network.model.js';

type PacketCounters = {
    packetsReceived: number;
    packetsSent: number;
};

@Injectable()
export class NetworkMetricsService {
    async getNetworkMetrics(): Promise<NetworkMetrics[]> {
        const [stats, interfaces] = await Promise.all([networkStats('*'), networkInterfaces()]);
        const speedByInterface = new Map(
            interfaces.map((networkInterface) => [networkInterface.iface, networkInterface.speed])
        );
        const collectedAt = new Date();

        return Promise.all(
            stats.map(async (stat) => {
                const counters = await this.getPacketCounters(stat.iface);
                const speed = speedByInterface.get(stat.iface);

                return this.toNetworkMetrics(stat, counters, speed, collectedAt);
            })
        );
    }

    private async getPacketCounters(iface: string): Promise<PacketCounters> {
        const [received, sent] = await Promise.all([
            this.readCounter(iface, 'rx_packets'),
            this.readCounter(iface, 'tx_packets'),
        ]);

        return {
            packetsReceived: received,
            packetsSent: sent,
        };
    }

    private async readCounter(iface: string, counter: 'rx_packets' | 'tx_packets'): Promise<number> {
        try {
            const rawValue = await readFile(`/sys/class/net/${iface}/statistics/${counter}`, 'utf8');
            const parsedValue = Number(rawValue.trim());

            return Number.isFinite(parsedValue) ? parsedValue : 0;
        } catch {
            return 0;
        }
    }

    private toNetworkMetrics(
        stat: Systeminformation.NetworkStatsData,
        counters: PacketCounters,
        speed: number | null | undefined,
        collectedAt: Date
    ): NetworkMetrics {
        const rxSec = stat.rx_sec ?? 0;
        const txSec = stat.tx_sec ?? 0;

        return {
            id: `metrics/network/${stat.iface}`,
            name: stat.iface,
            operstate: stat.operstate,
            bytesReceived: Math.floor(stat.rx_bytes),
            bytesSent: Math.floor(stat.tx_bytes),
            packetsReceived: counters.packetsReceived,
            packetsSent: counters.packetsSent,
            receiveErrors: Math.floor(stat.rx_errors),
            transmitErrors: Math.floor(stat.tx_errors),
            receiveDropped: Math.floor(stat.rx_dropped),
            transmitDropped: Math.floor(stat.tx_dropped),
            rxSec,
            txSec,
            utilizationPercent: this.calculateUtilizationPercent(rxSec, txSec, speed),
            lastUpdated: collectedAt,
        };
    }

    private calculateUtilizationPercent(
        rxSec: number,
        txSec: number,
        speed: number | null | undefined
    ): number | undefined {
        if (!speed || speed <= 0) {
            return undefined;
        }

        return ((rxSec + txSec) * 8 * 100) / (speed * 1_000_000);
    }
}
