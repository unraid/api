import { isIP } from 'node:net';

import { execa } from 'execa';

const IP_COMMAND = '/sbin/ip';
const ROUTE_FAMILIES = ['-4', '-6'] as const;

export function parseDefaultGatewayAddresses(output: string): string[] {
    const addresses = output.split(/\r?\n/).flatMap((line) => {
        const match = line.match(/^\s*default\s+via\s+(\S+)/);
        return match ? [match[1]] : [];
    });

    return [...new Set(addresses.filter((address) => isIP(address) !== 0))];
}

export async function getDefaultGatewayAddresses(): Promise<string[]> {
    const results = await Promise.allSettled(
        ROUTE_FAMILIES.map((family) =>
            execa(IP_COMMAND, [family, 'route', 'show', 'default'], { reject: false })
        )
    );

    return [
        ...new Set(
            results.flatMap((result) =>
                result.status === 'fulfilled' && result.value.exitCode === 0
                    ? parseDefaultGatewayAddresses(result.value.stdout)
                    : []
            )
        ),
    ];
}
