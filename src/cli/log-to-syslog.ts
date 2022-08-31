import { execaCommandSync } from 'execa';

export const logToSyslog = (text: string) => execaCommandSync(`logger -t unraid-api[${process.pid}] ${text}`);
