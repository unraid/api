import { Test, type TestingModule } from '@nestjs/testing';
import { CookieService, SESSION_COOKIE_CONFIG } from './cookie.service';
import { describe, it, beforeAll, afterAll } from 'vitest';
import { emptyDir, ensureFile } from 'fs-extra';

describe.concurrent('CookieService', () => {
    let service: CookieService;
    const sessionDir = '/tmp/php/sessions';

    // helper to create a session file
    function makeSession(sessionId: string, cookieService: CookieService = service) {
        const path = cookieService.getSessionFilePath(sessionId);
        return ensureFile(path);
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
        expect(session('')).toEqual('/tmp/php/sessions/sess_');
        expect(session(null)).toEqual('/tmp/php/sessions/sess_null');
        expect(session(undefined)).toEqual('/tmp/php/sessions/sess_undefined');
        expect(session(1)).toEqual('/tmp/php/sessions/sess_1');
        expect(session(1.0)).toEqual('/tmp/php/sessions/sess_1');
        expect(session(1.1)).toEqual('/tmp/php/sessions/sess_1.1');
        expect(session({})).toEqual('/tmp/php/sessions/sess_[object Object]');
        expect(session(['foo', 'bar'])).toEqual('/tmp/php/sessions/sess_foo,bar');
        expect(session('foo/bar')).toEqual('/tmp/php/sessions/sess_foo/bar');
    });

    it('can read an existing session & reject a non-existent one', async ({ expect }) => {
        const sessionId = '123abc';
        expect(await service.hasValidAuthCookie({ unraid_session: sessionId })).toBe(false);
        await makeSession(sessionId);
        expect(await service.hasValidAuthCookie({ unraid_session: sessionId })).toBe(true);
    });

    it('can recognize session cookies', async ({ expect }) => {
        const sessionId = '123abc';
        await makeSession(sessionId);
        expect(await service.hasValidAuthCookie({ unraid: sessionId })).toBe(false);
        expect(await service.hasValidAuthCookie({ unraid_: sessionId })).toBe(true);
        expect(await service.hasValidAuthCookie({ unraid_0: sessionId })).toBe(true);
        expect(await service.hasValidAuthCookie({ unraid_session: sessionId })).toBe(true);
    });
});
