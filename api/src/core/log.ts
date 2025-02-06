import { pino } from 'pino';
import pretty from 'pino-pretty';

import { LOG_TYPE } from '@app/environment';

export const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const;

export type LogLevel = (typeof levels)[number];

const level =
    levels[levels.indexOf(process.env.LOG_LEVEL?.toLowerCase() as (typeof levels)[number])] ?? 'info';

export const logDestination = pino.destination({
    sync: true,
});

const stream =
    LOG_TYPE === 'pretty'
        ? pretty({
              singleLine: true,
              hideObject: false,
              colorize: true,
              ignore: 'hostname,pid',
              destination: logDestination,
          })
        : logDestination;

export const logger = pino(
    {
        level,
        timestamp: () => `,"time":"${new Date().toLocaleTimeString()}"`,
        formatters: {
            level: (label: string) => ({ level: label }),
        },
    },
    stream
);

export const internalLogger = logger.child({ logger: 'internal' });
export const appLogger = logger.child({ logger: 'app' });
export const mothershipLogger = logger.child({ logger: 'mothership' });
export const dashboardLogger = logger.child({ logger: 'dashboard' });
export const emhttpLogger = logger.child({ logger: 'emhttp' });
export const libvirtLogger = logger.child({ logger: 'libvirt' });
export const graphqlLogger = logger.child({ logger: 'graphql' });
export const dockerLogger = logger.child({ logger: 'docker' });
export const cliLogger = logger.child({ logger: 'cli' });
export const minigraphLogger = logger.child({ logger: 'minigraph' });
export const cloudConnectorLogger = logger.child({ logger: 'cloud-connector' });
export const upnpLogger = logger.child({ logger: 'upnp' });
export const keyServerLogger = logger.child({ logger: 'key-server' });
export const remoteAccessLogger = logger.child({ logger: 'remote-access' });
export const remoteQueryLogger = logger.child({ logger: 'remote-query' });
export const apiLogger = logger.child({ logger: 'api' });

export const loggers = [
    internalLogger,
    appLogger,
    mothershipLogger,
    dashboardLogger,
    emhttpLogger,
    libvirtLogger,
    graphqlLogger,
    dockerLogger,
    cliLogger,
    minigraphLogger,
    cloudConnectorLogger,
    upnpLogger,
    keyServerLogger,
    remoteAccessLogger,
    remoteQueryLogger,
    apiLogger,
];
