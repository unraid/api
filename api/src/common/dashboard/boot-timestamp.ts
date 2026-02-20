import { uptime } from 'os';

function getSafeUptimeSeconds(): number {
    try {
        return uptime();
    } catch {
        // Some restricted environments can throw EPERM for os.uptime().
        return 0;
    }
}

// Get uptime on boot and convert to date
export const bootTimestamp = new Date(Date.now() - getSafeUptimeSeconds() * 1_000);
