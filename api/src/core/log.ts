import { pino } from 'pino';
import { LOG_TRANSPORT, LOG_TYPE } from '@app/environment';

import pretty from 'pino-pretty';
import { chmodSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { getters } from '@app/store/index';
import { join } from 'node:path';

const makeLoggingDirectoryIfNotExists = () => {
    if (!existsSync(getters.paths()['log-base'])) {
        console.log('Creating logging directory');
        mkdirSync(getters.paths()['log-base']);
    }

    chmodSync(getters.paths()['log-base'], 0o644);
    console.log('here');
    if (
        existsSync(`${getters.paths()['log-base']}/stdout.log`) &&
        statSync(`${getters.paths()['log-base']}/stdout.log`).size > 50_000
    ) {
        rmSync(`${getters.paths()['log-base']}/stdout.log`);
    }
    try {
        rmSync(`${getters.paths()['log-base']}/stdout.log.*`);
    } catch (e) {
        console.log('No old logs to remove');
    }
};

if (LOG_TRANSPORT === 'file') {
    makeLoggingDirectoryIfNotExists();
}

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

export const logDestination = pino.destination({
    dest:
        LOG_TRANSPORT === 'file'
            ? join(getters.paths()['log-base'], 'stdout.log')
            : 1,
    minLength: 1_024,
    sync: false,
});

const stream =
    LOG_TYPE === 'pretty'
        ? pretty({
              singleLine: true,
              hideObject: false,
              colorize: true,
              ignore: 'time,hostname,pid',
              destination: logDestination,
          })
        : logDestination;

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
