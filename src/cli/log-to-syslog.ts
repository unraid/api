import { commandSync } from 'execa';

export const logToSyslog = (text: string) => commandSync(`logger -t unraid-api[${process.pid}] ${text}`);
