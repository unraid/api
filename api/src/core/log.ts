import { pino } from 'pino';
import { LOG_TRANSPORT, LOG_TYPE } from '@app/environment';
import { createStream } from 'rotating-file-stream';
import pretty from 'pino-pretty';

export const levels = [
    'trace',
    'debug',
    'info',
    'warn',
    'error',
    'fatal',
] as const;

const level =
    levels[
        levels.indexOf(
            process.env.LOG_LEVEL?.toLowerCase() as (typeof levels)[number]
        )
    ] ?? 'info';

const logDestination =
    LOG_TRANSPORT === 'file'
        ? pino.destination(
              createStream('/var/log/unraid-api.log', {
                  size: '5M',
                  maxFiles: 1,
              })
          )
        : 1;

const stream =
    LOG_TYPE === 'pretty'
        ? pretty({
              singleLine: true,
              hideObject: false,
              colorize: true,
              ignore: 'time,hostname,pid',
              destination: logDestination,
          })
        : pino.destination(logDestination);

export const logger = pino(
    {
        level,
        timestamp: () => `,"time":"${new Date().toISOString()}"`,
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

// Send SIGUSR1 to increase log level
process.on('SIGUSR1', () => {
    const level = logger.level;
    const nextLevel =
        levels[levels.findIndex((_level) => _level === level) + 1] ?? levels[0];
    loggers.forEach((logger) => {
        logger.level = nextLevel;
    });
    internalLogger.info({
        message: `Log level changed from ${level} to ${nextLevel}`,
    });
});

// Send SIGUSR1 to decrease log level
process.on('SIGUSR2', () => {
    const level = logger.level;
    const nextLevel =
        levels[levels.findIndex((_level) => _level === level) - 1] ??
        levels[levels.length - 1];
    loggers.forEach((logger) => {
        logger.level = nextLevel;
    });
    internalLogger.info({
        message: `Log level changed from ${level} to ${nextLevel}`,
    });
});
