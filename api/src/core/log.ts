import pino from 'pino';
import pretty from 'pino-pretty';

import { API_VERSION, LOG_LEVEL, LOG_TYPE, PATHS_LOGS_FILE, SUPPRESS_LOGS } from '@app/environment.js';

export const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const;

export type LogLevel = (typeof levels)[number];

const level = levels[levels.indexOf(LOG_LEVEL.toLowerCase() as LogLevel)] ?? 'info';

const nullDestination = pino.destination({
    write() {
        // Suppress all logs
    },
});

const LOG_TRANSPORT = process.env.LOG_TRANSPORT ?? 'file';
const useConsole = LOG_TRANSPORT === 'console';

export const logDestination =
    process.env.SUPPRESS_LOGS === 'true'
        ? nullDestination
        : useConsole
          ? pino.destination(1) // stdout
          : pino.destination({ dest: PATHS_LOGS_FILE, mkdir: true });

const stream = SUPPRESS_LOGS
    ? nullDestination
    : LOG_TYPE === 'pretty'
      ? pretty({
            singleLine: true,
            hideObject: false,
            colorize: useConsole, // Enable colors when outputting to console
            colorizeObjects: useConsole,
            levelFirst: false,
            ignore: 'hostname,pid',
            destination: logDestination,
            translateTime: 'SYS:HH:mm:ss',
            customPrettifiers: {
                time: (timestamp: string | object) => `[${timestamp}`,
                level: (_logLevel: string | object, _key: string, log: any, extras: any) => {
                    const { label, labelColorized } = extras;
                    const context = log.context || log.logger || 'app';
                    // Use colorized label when outputting to console
                    return `${useConsole ? labelColorized : label} ${context}]`;
                },
            },
            messageFormat: (log: any, messageKey: string) => {
                const msg = log[messageKey] || log.msg || '';
                return msg;
            },
        })
      : logDestination;

export const logger = pino(
    {
        level,
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
            level: (label: string) => ({ level: label }),
            bindings: (bindings) => ({ ...bindings, apiVersion: API_VERSION }),
        },
        redact: {
            paths: [
                '*.password',
                '*.pass',
                '*.secret',
                '*.token',
                '*.key',
                '*.Password',
                '*.Pass',
                '*.Secret',
                '*.Token',
                '*.Key',
                '*.apikey',
                '*.localApiKey',
                '*.accesstoken',
                '*.idtoken',
                '*.refreshtoken',
            ],
            censor: '***REDACTED***',
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
export const pluginLogger = logger.child({ logger: 'plugin' });

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

export function sanitizeParams(params: Record<string, any>): Record<string, any> {
    const SENSITIVE_KEYS = ['password', 'secret', 'token', 'key', 'client_secret'];
    const mask = (value: any) => (typeof value === 'string' && value.length > 0 ? '***' : value);
    const sanitized: Record<string, any> = {};
    for (const k in params) {
        if (SENSITIVE_KEYS.some((s) => k.toLowerCase().includes(s))) {
            sanitized[k] = mask(params[k]);
        } else if (typeof params[k] === 'object' && params[k] !== null && !Array.isArray(params[k])) {
            sanitized[k] = sanitizeParams(params[k]);
        } else {
            sanitized[k] = params[k];
        }
    }
    return sanitized;
}
