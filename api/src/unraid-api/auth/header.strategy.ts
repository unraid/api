import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-header-strategy';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class ServerHeaderStrategy extends PassportStrategy(
    Strategy,
    'server-http-header'
) {
    static key = 'server-http-header';
    private readonly logger = new Logger(ServerHeaderStrategy.name);

    constructor(private readonly authService: AuthService) {
        super({ header: 'x-api-key', passReqToCallback: true });
    }

    public validate = async (
        req,
        apiKey: string
    ): Promise<any> => {
        this.logger.debug('Validating API key');
        const user = await this.authService.validateUser(apiKey);

        if (!user) {
            this.logger.debug('API key validation failed');
            throw new UnauthorizedException();
        }
        return user;
    };
}
