import pretty from 'pino-pretty';
import { expect, test } from 'vitest';

import { PRETTY_LOG_TIME_FORMAT } from '@app/core/log.constants.js';

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
