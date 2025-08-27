import { Injectable, Logger } from '@nestjs/common';
import { randomBytes, timingSafeEqual } from 'crypto';
import { chmod, mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { dirname } from 'path';

import { PATHS_LOCAL_SESSION_FILE } from '@app/environment.js';

/**
 * Service that manages a local session file for internal CLI/system authentication.
 * Creates a secure token on startup that can be used for local system operations.
 */
@Injectable()
export class LocalSessionService {
    private readonly logger = new Logger(LocalSessionService.name);
    private sessionToken: string | null = null;
    private static readonly SESSION_FILE_PATH = PATHS_LOCAL_SESSION_FILE;

    /**
     * Generate a secure local session token and write it to file
     */
    async generateLocalSession(): Promise<void> {
        // Generate a cryptographically secure random token
        this.sessionToken = randomBytes(32).toString('hex');

        try {
            // Ensure directory exists
            await mkdir(dirname(LocalSessionService.getSessionFilePath()), { recursive: true });

            // Write token to file
            await writeFile(LocalSessionService.getSessionFilePath(), this.sessionToken, {
                encoding: 'utf-8',
                mode: 0o600, // Owner read/write only
            });

            // Ensure proper permissions (redundant but explicit)
            // Check if file exists first to handle race conditions in test environments
            await chmod(LocalSessionService.getSessionFilePath(), 0o600).catch((error) => {
                this.logger.warn(error, 'Failed to set permissions on local session file');
            });

            this.logger.debug(`Local session written to ${LocalSessionService.getSessionFilePath()}`);
        } catch (error) {
            this.logger.error(`Failed to write local session: ${error}`);
            throw error;
        }
    }

    /**
     * Read and return the current local session token from file
     */
    public async getLocalSession(): Promise<string | null> {
        try {
            return await readFile(LocalSessionService.getSessionFilePath(), 'utf-8');
        } catch (error) {
            this.logger.warn(error, 'Local session file not found or not readable');
            return null;
        }
    }

    /**
     * Validate if a given token matches the current local session
     */
    public async validateLocalSession(token: string): Promise<boolean> {
        if (!token) return false;

        const currentToken = await this.getLocalSession();
        if (!currentToken) return false;

        // Use constant-time comparison to prevent timing attacks
        return timingSafeEqual(Buffer.from(token, 'utf-8'), Buffer.from(currentToken, 'utf-8'));
    }

    public async deleteLocalSession(): Promise<void> {
        try {
            await unlink(LocalSessionService.getSessionFilePath());
        } catch (error) {
            this.logger.error(error, 'Error deleting local session file');
        }
    }

    /**
     * Get the file path for the local session (useful for external readers)
     */
    public static getSessionFilePath(): string {
        return LocalSessionService.SESSION_FILE_PATH;
    }
}
