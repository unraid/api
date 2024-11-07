import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Injectable, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { CustomRequest } from '../types/request';

const strategyName = 'user-cookie';

@Injectable()
export class UserCookieStrategy extends PassportStrategy(Strategy, strategyName) {
    static key = strategyName;
    private readonly logger = new Logger(UserCookieStrategy.name);

    constructor(private readonly authService: AuthService) {
        super();
    }

    public validate = async (req: CustomRequest): Promise<any> => {
        return this.authService.validateCookiesCasbin(req.cookies);
    };
}
