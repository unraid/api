import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-header-strategy';
import { Injectable, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class ServerHeaderStrategy extends PassportStrategy(Strategy, 'server-http-header') {
    static key = 'server-http-header';
    private readonly logger = new Logger(ServerHeaderStrategy.name);

    constructor(
        private readonly authService: AuthService,
    ) {
        super({ header: 'x-api-key', passReqToCallback: false });
    }

    public validate = async (apiKey: string): Promise<any> => {
        this.logger.debug('Validating API key');
        const user = await this.authService.validateUser(apiKey);

        return user;
    };
}
