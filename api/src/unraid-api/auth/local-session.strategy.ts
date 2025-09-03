import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { Strategy } from 'passport-custom';

import { AuthService } from '@app/unraid-api/auth/auth.service.js';
import { UserAccount } from '@app/unraid-api/graph/user/user.model.js';
import { FastifyRequest } from '@app/unraid-api/types/fastify.js';

/**
 * Passport strategy for local session authentication.
 * Validates the x-local-session header for internal CLI/system operations.
 */
@Injectable()
export class LocalSessionStrategy extends PassportStrategy(Strategy, 'local-session') {
    static readonly key = 'local-session';
    private readonly logger = new Logger(LocalSessionStrategy.name);

    constructor(private readonly authService: AuthService) {
        super();
    }

    async validate(request: FastifyRequest): Promise<UserAccount | null> {
        try {
            const localSessionToken = request.headers['x-local-session'] as string;

            if (!localSessionToken) {
                this.logger.verbose('No local session token found in request headers');
                return null;
            }

            this.logger.verbose('Attempting to validate local session token');
            const user = await this.authService.validateLocalSession(localSessionToken);

            if (user) {
                this.logger.verbose(`Local session authenticated user: ${user.name}`);
                return user;
            }

            return null;
        } catch (error) {
            this.logger.verbose(error, `Local session validation failed`);
            return null;
        }
    }
}
