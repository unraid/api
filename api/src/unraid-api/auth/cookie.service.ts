import { fileExists } from '@app/core/utils/files/file-exists';
import { batchProcess } from '@app/utils';
import { Injectable, Inject } from '@nestjs/common';
import { join } from 'path';

/** token for dependency injection of a session cookie options object */
export const SESSION_COOKIE_OPTIONS = 'SESSION_COOKIE_OPTIONS';

type SessionCookieOptions = {
    namePrefix: string;
    sessionDir: string;
};

@Injectable()
export class CookieService {
    constructor(
        @Inject(SESSION_COOKIE_OPTIONS) readonly opts: SessionCookieOptions = CookieService.defaultOpts()
    ) {}

    /**
     * @returns new SessionCookieOptions with `namePrefix: 'unraid_', sessionDir: '/var/lib/php'`
     */
    static defaultOpts(): SessionCookieOptions {
        return { namePrefix: 'unraid_', sessionDir: '/var/lib/php' };
    }

    /**
     * Given a cookies object, returns true if any of the cookies are a valid unraid session cookie.
     * @param cookies an object of cookie name => cookie value
     * @param opts optional overrides for the session directory & prefix of the session cookie to look for
     * @returns true if any of the cookies are a valid unraid session cookie, false otherwise
     */
    async hasValidAuthCookie(cookies: object): Promise<boolean> {
        const { data } = await batchProcess(Object.entries(cookies), ([cookieName, cookieValue]) =>
            this.isValidAuthCookie(String(cookieName), String(cookieValue))
        );
        return data.some((valid) => valid);
    }

    /**
     * Checks if a given details point to a valid unraid session cookie.
     *
     * A valid cookie is one where the name starts with the configured prefix
     * and the value corresponds to an existing session file on disk.
     *
     * @param cookieName the name of the cookie to check
     * @param cookieValue the value of the cookie to check
     * @returns true if the cookie is valid, false otherwise
     */
    private async isValidAuthCookie(cookieName: string, cookieValue: string): Promise<boolean> {
        const { namePrefix } = this.opts;
        if (!cookieName.startsWith(namePrefix)) {
            return false;
        }
        return fileExists(this.getSessionFilePath(cookieValue));
    }

    /**
     * Given a session id, returns the full path to the session file on disk.
     *
     * @param sessionId the session id, as read from the session cookie.
     * @param basePath path to the directory of session files.
     * @returns the full path to the session file on disk.
     */
    public getSessionFilePath(sessionId: string): string {
        return join(this.opts.sessionDir, `sess_${sessionId}`);
    }
}
