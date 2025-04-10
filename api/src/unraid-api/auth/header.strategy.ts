import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { Strategy } from 'passport-http-header-strategy';

import { AuthService } from '@app/unraid-api/auth/auth.service.js';
import { UserAccount } from '@app/unraid-api/graph/user/user.model.js';

@Injectable()
export class ServerHeaderStrategy extends PassportStrategy(Strategy, 'server-http-header') {
    static key = 'server-http-header';
    private readonly logger = new Logger(ServerHeaderStrategy.name);

    constructor(private readonly authService: AuthService) {
        super({
            header: 'x-api-key',
            passReqToCallback: true,
        });
    }

    async validate(req: any): Promise<UserAccount | null> {
        const request = req.req || req;
        const key = request.headers?.['x-api-key'];

        if (!key) {
            this.logger.debug('No API key provided');
            throw new UnauthorizedException('No API key provided');
        }

        if (!/^[a-zA-Z0-9-_]+$/.test(key)) {
            this.logger.warn('Invalid API key format');
            throw new UnauthorizedException('Invalid API key format');
        }

        try {
            const user = await this.authService.validateApiKeyCasbin(key);
            this.logger.debug('API key validation successful %o', {
                userId: user?.id,
                roles: user?.roles,
            });

            return user;
        } catch (error) {
            this.logger.error('API key validation failed %o', {
                errorType: error instanceof Error ? error.constructor.name : 'Unknown',
                message: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new UnauthorizedException('API key validation failed');
        }
    }
}
