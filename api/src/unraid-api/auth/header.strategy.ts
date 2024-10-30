import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { AuthService } from './auth.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class ServerHeaderStrategy extends PassportStrategy(Strategy, 'server-http-header') {
    private readonly logger = new Logger(ServerHeaderStrategy.name);
    static readonly key = 'server-http-header';

    constructor(private authService: AuthService) {
        super();
    }

    async validate(request: Request): Promise<any> {
        this.logger.debug('Validating API key');

        const apiKey = request.headers?.['x-api-key'];

        if (!apiKey) {
            return null;
        }

        return this.authService.validateApiKeyCasbin(apiKey);
    }
}
