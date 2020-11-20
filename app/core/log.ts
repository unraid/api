/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { format } from 'util';
import chalk from 'chalk';
import SysLogger from 'ain2';
import getHex from 'number-to-color/hexMap.js';
import { redactSecrets } from 'redact-secrets';

const levels = ['error', 'warn', 'info', 'debug', 'trace'] as const;
const transports = ['console', 'syslog'] as const;

class Logger {
    public level = 'info' as typeof levels[number];
    public levels = levels;
    public transport = (process.env.DEBUG ? 'console' : 'syslog') as typeof transports[number];
    public transports = transports;

    private timers = [];
    private syslog: SysLogger;

    // Replace secrets with the following
    private redact = redactSecrets('[REDACTED]', {
        keys: [],
        values: []
    });

    private colour(level: typeof levels[number]) {
        return getHex(this.levels.indexOf(level) / this.levels.length);
    }

    private addColourToString(hex: string, string: string) {
        return chalk.hex(hex)(string);
    }

    constructor(private prefix: string = '') {
        try {
            this.syslog = new SysLogger({
                tag: 'unraid-api',
                path: '/dev/log'
            });
            
            this.syslog.setMessageComposer(function(message: string, severity: number) {
                const severityLevel = {
                    0: 'emergency',
                    1: 'alert',
                    2: 'critical',
                    3: 'error',
                    4: 'warning',
                    5: 'notice',
                    6: 'info',
                    7: 'debug'
                };
                // @ts-ignore
                return new Buffer.from(`<${this.facility * 8 + severity}>${this.tag} [${severityLevel[severity]}]: ${message}`);
            });
        } catch {};
            
        process.on('SIGUSR2', () => {
            const index = this.levels.indexOf(this.level);
            // level 0 === Errors
            // level 1 === Warnings
            // level 2 === Info
            // level 3 === Debug
            // level 4 === Trace
            // error -> warn -> info -> debug -> trace
            if (index === (this.levels.length - 1)) {
                // End of list -> loop
                this.level = this.levels[0];
            } else {
                // Next level
                this.level = this.levels[index + 1];
            }
        
            this._log('debug', 'Log level updated to %s.', [this.level]);
        });

    }

    log(level: typeof levels[number], message: string, args: any[]) {
        // Only enable logging when `this.level >= level`.
        if (this.levels.indexOf(this.level) >= this.levels.indexOf(level)) {
            this._log(level, message, args);
        }
    }
    
    private _log(level: typeof levels[number], message: string, args: any[]) {
        if (this.transport === 'console') {
            console[level].call(console, `[${this.addColourToString(this.colour(level), level)}] ${this.prefix}${message}`, ...this.redact.map(args));
        }
        if (this.transport === 'syslog') {
            this.syslog[level](format(message, ...args.map(arg => this.redact.map(arg))));
        }
    }

    createChild(prefix: string) {
        return new Logger(`${this.prefix}${prefix}`);
    }

    debug(message: string, ...args: any[]): void {
        this.log('debug', message, args);
    }

    info(message: string, ...args: any[]): void {
        this.log('info', message, args);
    }

    warn(message: string, ...args: any[]): void {
        this.log('warn', message, args);
    }

    error(message: Error): void;
    error(message: string, ...args: any[]): void;
    error(message: any, ...args: any[]): void {
        if (message instanceof Error) {
            this.log('error', message.message, args);
        } else {
            this.log('error', message, args);
        }
    }

    trace(message: string, ...args: any[]): void {
        this.log('trace', message, args);
    }

    timer(name: string): void {
        if (this.timers[name]) {
            delete this.timers[name];
            console.timeEnd.call(console, name);
        } else {
            this.timers[name] = true;
            console.time.call(console, name);
        }
    }
};

export const log = new Logger();

export const coreLogger = log.createChild('[@unraid/core]: ');
export const mothershipLogger = log.createChild('[@unraid/mothership]: ');
export const graphqlLogger = log.createChild('[@unraid/graphql]: ');
export const discoveryLogger = log.createChild('[@unraid/discovery]: ');