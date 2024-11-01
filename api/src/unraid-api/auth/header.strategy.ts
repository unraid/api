import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';

import { AuthService } from './auth.service';
import { User } from '@app/graphql/generated/api/types';

@Injectable()
export class ServerHeaderStrategy extends PassportStrategy(Strategy, 'server-http-header') {
    private readonly logger = new Logger(ServerHeaderStrategy.name);
    static readonly key = 'server-http-header';

    constructor(private authService: AuthService) {
        super();
    }

    async validate(request: Request): Promise<User | null> {
        this.logger.debug('Validating API key');
        const apiKey = (request.headers?.['x-api-key'] || request.headers?.['X-API-KEY']) as
            | string
            | undefined;

        if (!apiKey) {
            this.logger.debug('No API key provided');
            return null;
        }

        if (!/^[a-zA-Z0-9-_]+$/.test(apiKey)) {
            this.logger.warn('Invalid API key format');
            return null;
        }

        try {
            return this.authService.validateApiKeyCasbin(apiKey);
        } catch (error) {
            this.logger.error('API key validation failed', error);
            return null;
        }
    }
}
