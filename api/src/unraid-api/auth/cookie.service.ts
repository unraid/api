import { Inject, Injectable, Logger } from '@nestjs/common';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

import { fileExists } from '@app/core/utils/files/file-exists.js';
import { getters } from '@app/store/index.js';
import { batchProcess } from '@app/utils.js';

/** token for dependency injection of a session cookie options object */
export const SESSION_COOKIE_CONFIG = 'SESSION_COOKIE_CONFIG';

type SessionCookieConfig = {
    namePrefix: string;
    sessionDir: string;
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'lax' | 'strict' | 'none';
};

@Injectable()
export class CookieService {
    private readonly logger = new Logger(CookieService.name);
    constructor(
        @Inject(SESSION_COOKIE_CONFIG) readonly opts: SessionCookieConfig = CookieService.defaultOpts()
    ) {}

    /**
     * @returns new SessionCookieOptions with e.g. `namePrefix: 'unraid_', sessionDir: '/var/lib/php'`
     */
    static defaultOpts(): SessionCookieConfig {
        return {
            namePrefix: 'unraid_',
            sessionDir: getters.paths()['auth-sessions'],
            secure: true,
            httpOnly: true,
            sameSite: 'lax',
        };
    }

    /**
     * Given a cookies object, returns true if any of the cookies are a valid unraid session cookie.
     * @param cookies an object of cookie name => cookie value
     * @param opts optional overrides for the session directory & prefix of the session cookie to look for
     * @returns true if any of the cookies are a valid unraid session cookie, false otherwise
     */
    async hasValidAuthCookie(cookies: Record<string, string | undefined>): Promise<boolean> {
        const { data } = await batchProcess(Object.entries(cookies), ([cookieName, cookieValue]) =>
            this.isValidAuthCookie(String(cookieName), String(cookieValue ?? ''))
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
        const sessionFile = this.getSessionFilePath(cookieValue);
        if (!cookieName.startsWith(namePrefix) || !(await fileExists(sessionFile))) {
            return false;
        }
        try {
            const sessionData = await readFile(sessionFile, 'ascii');
            return this.isSessionValid(sessionData);
        } catch (e) {
            this.logger.error(e, 'Error reading session file');
            return false;
        }
    }

    private isSessionValid(sessionData: string): boolean {
        return sessionData.includes('unraid_login') && sessionData.includes('unraid_user');
    }

    /**
     * Given a session id, returns the full path to the session file on disk.
     *
     * @param sessionId the session id, as read from the session cookie.
     * @param basePath path to the directory of session files.
     * @returns the full path to the session file on disk.
     */
    public getSessionFilePath(sessionId: string): string {
        if (typeof sessionId !== 'string') {
            return join(this.opts.sessionDir, `sess_`);
        }
        // sanitize incoming session id to prevent e.g. directory traversal attacks
        // only allow alpha-numeric characters
        const sanitizedSessionId = sessionId.replace(/[^a-zA-Z0-9]/g, '');
        return join(this.opts.sessionDir, `sess_${sanitizedSessionId}`);
    }

    /**
     * Returns the active session id, if any.
     * @returns the active session id, if any, or null if no active session is found.
     */
    async getActiveSession(): Promise<string | null> {
        let sessionFiles: string[] = [];
        try {
            sessionFiles = await readdir(this.opts.sessionDir);
        } catch (e) {
            this.logger.warn(e, 'Error reading session directory');
            return null;
        }
        for (const sessionFile of sessionFiles) {
            if (!sessionFile.startsWith('sess_')) {
                continue;
            }
            try {
                const sessionData = await readFile(join(this.opts.sessionDir, sessionFile), 'ascii');
                if (this.isSessionValid(sessionData)) {
                    return sessionFile.replace('sess_', '');
                }
            } catch {
                // Ignore unreadable files and continue scanning
                continue;
            }
        }
        return null;
    }
}
