import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { writeFile } from 'node:fs/promises';

import { emptyDir } from 'fs-extra';
import { afterAll, beforeAll, describe, it } from 'vitest';

import { CookieService, SESSION_COOKIE_CONFIG } from '@app/unraid-api/auth/cookie.service.js';

describe.concurrent('CookieService', () => {
    let service: CookieService;
    const sessionDir = '/tmp/php/sessions';

    // helper to create a session file
    function makeSession(sessionId: string, cookieService: CookieService = service) {
        const path = cookieService.getSessionFilePath(sessionId);
        return writeFile(
            path,
            `unraid_login|i:1736523078;unraid_user|s:4:"root";locale|s:0:"";buildDate|s:8:"20241202";`,
            'ascii'
        );
    }

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CookieService,
                { provide: SESSION_COOKIE_CONFIG, useValue: { namePrefix: 'unraid_', sessionDir } },
            ],
        }).compile();

        service = module.get<CookieService>(CookieService);
        await emptyDir(sessionDir);
    });

    afterAll(async () => {
        await emptyDir(sessionDir);
    });

    it('has completed test setup', ({ expect }) => {
        expect(service).toBeDefined();
        expect(service.opts.sessionDir).toEqual(sessionDir);
        expect(service.opts.namePrefix).toEqual('unraid_');
    });

    it('handles session names robustly', ({ expect }) => {
        const session = (name?: unknown) => service.getSessionFilePath(name as string);
        expect(session('foo')).toEqual('/tmp/php/sessions/sess_foo');
        expect(session('foo123')).toEqual('/tmp/php/sessions/sess_foo123');
        expect(session('/foo123*&/^\n\r\'"!;:/../~`+=@#$%(?) \t/~/.profile')).toEqual(
            '/tmp/php/sessions/sess_foo123profile'
        );
        expect(session('')).toEqual('/tmp/php/sessions/sess_');
        expect(session(null)).toEqual('/tmp/php/sessions/sess_');
        expect(session(undefined)).toEqual('/tmp/php/sessions/sess_');
        expect(session(1)).toEqual('/tmp/php/sessions/sess_');
        expect(session(1.0)).toEqual('/tmp/php/sessions/sess_');
        expect(session(1.1)).toEqual('/tmp/php/sessions/sess_');
        expect(session({})).toEqual('/tmp/php/sessions/sess_');
        expect(session(['foo', 'bar'])).toEqual('/tmp/php/sessions/sess_');
        expect(session('foo/bar')).toEqual('/tmp/php/sessions/sess_foobar');
    });

    it('can read an existing session & reject a non-existent one', async ({ expect }) => {
        const sessionId = '123abc';
        expect(await service.hasValidAuthCookie({ unraid_session: sessionId })).toBe(false);
        await makeSession(sessionId);
        expect(await service.hasValidAuthCookie({ unraid_session: sessionId })).toBe(true);
    });

    it('can recognize session cookies', async ({ expect }) => {
        const sessionId = '123abcF00';
        await makeSession(sessionId);
        expect(await service.hasValidAuthCookie({ unraid: sessionId })).toBe(false);
        expect(await service.hasValidAuthCookie({ unraid_: sessionId })).toBe(true);
        expect(await service.hasValidAuthCookie({ unraid_0: sessionId })).toBe(true);
        expect(await service.hasValidAuthCookie({ unraid_session: sessionId })).toBe(true);
    });
});
