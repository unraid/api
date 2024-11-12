import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { Strategy } from 'passport-http-header-strategy';

import { User } from '@app/graphql/generated/api/types';

import { AuthService } from './auth.service';

@Injectable()
export class ServerHeaderStrategy extends PassportStrategy(Strategy, 'server-http-header') {
    static key = 'server-http-header';
    private readonly logger = new Logger(ServerHeaderStrategy.name);

    constructor(private readonly authService: AuthService) {
        super({
            header: 'x-api-key',
            passReqToCallback: false,
        });
    }

    async validate(apiKey: string): Promise<User | null> {
        this.logger.debug('Validating API key');

        if (!apiKey) {
            this.logger.debug('No API key provided');
            throw new UnauthorizedException('No API key provided');
        }

        if (!/^[a-zA-Z0-9-_]+$/.test(apiKey)) {
            this.logger.warn('Invalid API key format');
            throw new UnauthorizedException('Invalid API key format');
        }

        try {
            return this.authService.validateApiKeyCasbin(apiKey);
        } catch (error) {
            this.logger.error('API key validation failed', {
                error: 'Authorization failed',
                timestamp: new Date().toISOString(),
                errorType: error instanceof Error ? error.constructor.name : 'Unknown',
            });
            throw new UnauthorizedException('API key validation failed');
        }
    }
}
