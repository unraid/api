import { fileExists } from '@app/core/utils/files/file-exists';
import { batchProcess } from '@app/utils';
import { Injectable } from '@nestjs/common';
import { join } from 'path';

@Injectable()
export class CookieService {
    /**
     * Given a cookies object, returns true if any of the cookies are a valid unraid session cookie.
     * @param cookies an object of cookie name => cookie value
     * @returns true if any of the cookies are a valid unraid session cookie, false otherwise
     */
    async hasValidAuthCookie(cookies: object): Promise<boolean> {
        const { data } = await batchProcess(Object.entries(cookies), ([cookieName, cookieValue]) =>
            this.isValidAuthCookie(String(cookieName), String(cookieValue))
        );
        return data.some((valid) => valid);
    }

    async isValidAuthCookie(cookieName: string, cookieValue: string): Promise<boolean> {
        if (!cookieName.startsWith('unraid_')) {
            return false;
        }
        return fileExists(this.makeSessionFilePath(cookieValue));
    }

    /**
     * Given a session id, returns the full path to the session file on disk.
     *
     * @param sessionId the session id, as read from the session cookie.
     * @returns the full path to the session file on disk.
     */
    private makeSessionFilePath(sessionId: string): string {
        return join('/var/lib/php', `sess_${sessionId}`);
    }
}
