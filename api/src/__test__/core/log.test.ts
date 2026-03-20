import { once } from 'node:events';
import { Writable } from 'node:stream';

import pino from 'pino';
import pretty from 'pino-pretty';
import { expect, test } from 'vitest';

import { PRETTY_LOG_TIME_FORMAT } from '@app/core/log.constants.js';
import { LOG_REDACT_PATHS } from '@app/core/log.js';

const padTime = (value: number) => value.toString().padStart(2, '0');

test('pretty log timestamps keep local minutes instead of using the month token', () => {
    const timestamp = '2026-03-15T20:21:34.611Z';
    const date = new Date(timestamp);
    const expectedTime = `${padTime(date.getHours())}:${padTime(date.getMinutes())}:${padTime(date.getSeconds())}`;

    const prettify = pretty.prettyFactory({
        colorize: false,
        translateTime: PRETTY_LOG_TIME_FORMAT,
    });

    const output = prettify({
        level: 30,
        time: timestamp,
        pid: 123,
        hostname: 'tower',
        msg: 'test message',
    });

    expect(output).toContain(`[${expectedTime}]`);
    expect(output).toContain('INFO');
    expect(output).toContain('test message');
    expect(output).not.toContain('[16:03:34');
});

test('logger redacts encrypted array unlock fields', async () => {
    const chunks: string[] = [];
    const stream = new Writable({
        write(chunk, _encoding, callback) {
            chunks.push(chunk.toString());
            callback();
        },
    });

    const testLogger = pino(
        {
            redact: {
                paths: [...LOG_REDACT_PATHS],
                censor: '***REDACTED***',
            },
        },
        stream
    );

    testLogger.info({
        commands: {
            luksKey: 'secret-passphrase',
            luksKeyfile: '/tmp/unraid/keyfile',
            decryptionPassword: 'super-secret',
            decryptionKeyfile: 'data:application/octet-stream;base64,QUJDRA==',
            startState: 'STOPPED',
        },
    });

    stream.end();
    await once(stream, 'finish');

    const output = chunks.join('');

    expect(output).toContain('***REDACTED***');
    expect(output).toContain('"startState":"STOPPED"');
    expect(output).not.toContain('secret-passphrase');
    expect(output).not.toContain('/tmp/unraid/keyfile');
    expect(output).not.toContain('super-secret');
    expect(output).not.toContain('data:application/octet-stream;base64,QUJDRA==');
});
