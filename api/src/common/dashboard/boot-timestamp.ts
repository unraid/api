import { uptime } from 'os';

// Get uptime on boot and convert to date
export const bootTimestamp = new Date(new Date().getTime() - (uptime() * 1_000));
