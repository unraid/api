import chalk from 'chalk';
import { pino, type LoggerOptions } from 'pino';
import { LOG_TYPE } from '@app/environment';
import { serializeError } from 'serialize-error';

export const levels = [
    'trace',
    'debug',
    'info',
    'warn',
    'error',
    'fatal',
] as const;

const contextEnabled = Boolean(process.env.LOG_CONTEXT);
const stackEnabled = Boolean(process.env.LOG_STACKTRACE);
const tracingEnabled = Boolean(process.env.LOG_TRACING);
const fullLoggingPattern = chalk`{gray [%d]} %x\{id\} %[[%p]%] %[[%c]%] %m{gray %x\{context\}}${
    tracingEnabled ? ' %[%f:%l%]' : ''
}`;
const minimumLoggingPattern = '%m';
const appenders = process.env.LOG_TRANSPORT?.split(',').map((transport) =>
    transport.trim()
) ?? ['out'];
const level =
    levels[
        levels.indexOf(
            process.env.LOG_LEVEL?.toLowerCase() as (typeof levels)[number]
        )
    ] ?? 'info';
const logLayout = {
    type: 'pattern',
    // Depending on what this env is set to we'll either get raw or pretty logs
    // The reason we do this is to allow the app to change this value
    // This way pretty logs can be turned off programmatically
    pattern:
        process.env.LOG_TYPE === 'pretty'
            ? fullLoggingPattern
            : minimumLoggingPattern,
    tokens: {
        id() {
            return chalk`{gray [${process.pid}]}`;
        },
        context({ context }: { context?: any }) {
            if (!contextEnabled || !context) {
                return '';
            }

            try {
                const contextEntries = Object.entries(context)
                    .map(([key, value]) => [
                        key,
                        value instanceof Error
                            ? stackEnabled
                                ? serializeError(value)
                                : value
                            : value,
                    ])
                    .filter(([key]) => key !== 'pid');
                const cleanContext = Object.fromEntries(contextEntries);
                return `\n${Object.entries(cleanContext)
                    .map(
                        ([key, value]) =>
                            `${key}=${JSON.stringify(value, null, 2)}`
                    )
                    .join(' ')}`;
            } catch (error: unknown) {
                const errorInfo =
                    error instanceof Error
                        ? `${error.message}: ${error.stack ?? 'no stack'}`
                        : 'Error not instance of error';
                return `Error generating context: ${errorInfo}`;
            }
        },
    },
};

const pinoOptions: LoggerOptions = {
    level,
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
    formatters: {
        level: (label: string) => ({ level: label }),
    },
    /* transport: {
        options: { colorize: true },
        target: LOG_TYPE === 'pretty' ? 'pino-pretty' : '',
    }, */
};

export const logger = pino(pinoOptions);

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

export const loggers = [
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
