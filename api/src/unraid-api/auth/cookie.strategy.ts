import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { Strategy } from 'passport-custom';

import type { CustomRequest } from '../types/request';
import { AuthService } from './auth.service';

const strategyName = 'user-cookie';

@Injectable()
export class UserCookieStrategy extends PassportStrategy(Strategy, strategyName) {
    static key = strategyName;
    private readonly logger = new Logger(UserCookieStrategy.name);

    constructor(private authService: AuthService) {
        super();
    }

    public validate = async (req: CustomRequest): Promise<any> => {
        return this.authService.validateCookiesCasbin(req.cookies);
    };
}
