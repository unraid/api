import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { randomBytes, timingSafeEqual } from 'crypto';
import { chmod, mkdir, readFile, writeFile } from 'fs/promises';
import { dirname } from 'path';

/**
 * Service that manages a local session file for internal CLI/system authentication.
 * Creates a secure token on startup that can be used for local system operations.
 */
@Injectable()
export class LocalSessionService implements OnModuleInit {
    private readonly logger = new Logger(LocalSessionService.name);
    private sessionToken: string | null = null;
    private static readonly SESSION_FILE_PATH = '/var/run/unraid-api/local-session';

    // NOTE: do NOT cleanup the session file upon eg. module/application shutdown.
    // That would invalidate the session after each cli invocation, which is incorrect.
    // Instead, rely on the startup logic to invalidate/overwrite any obsolete session.
    async onModuleInit() {
        try {
            await this.generateLocalSession();
            this.logger.verbose('Local session initialized');
        } catch (error) {
            this.logger.error('Failed to initialize local session:', error);
        }
    }

    /**
     * Generate a secure local session token and write it to file
     */
    private async generateLocalSession(): Promise<void> {
        // Generate a cryptographically secure random token
        this.sessionToken = randomBytes(32).toString('hex');

        try {
            // Ensure directory exists
            await mkdir(dirname(LocalSessionService.SESSION_FILE_PATH), { recursive: true });

            // Write token to file
            await writeFile(LocalSessionService.SESSION_FILE_PATH, this.sessionToken, {
                encoding: 'utf-8',
                mode: 0o600, // Owner read/write only
            });

            // Ensure proper permissions (redundant but explicit)
            await chmod(LocalSessionService.SESSION_FILE_PATH, 0o600);

            this.logger.debug(`Local session written to ${LocalSessionService.SESSION_FILE_PATH}`);
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
            return await readFile(LocalSessionService.SESSION_FILE_PATH, 'utf-8');
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

    /**
     * Get the file path for the local session (useful for external readers)
     */
    public static getSessionFilePath(): string {
        return LocalSessionService.SESSION_FILE_PATH;
    }
}
