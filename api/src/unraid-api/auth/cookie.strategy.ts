import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { Strategy } from 'passport-custom';

import { FastifyRequest } from '@app/types/fastify.js';
import { AuthService } from '@app/unraid-api/auth/auth.service.js';

const strategyName = 'user-cookie';

@Injectable()
export class UserCookieStrategy extends PassportStrategy(Strategy, strategyName) {
    static key = strategyName;
    private readonly logger = new Logger(UserCookieStrategy.name);

    constructor(private authService: AuthService) {
        super();
    }

    public validate = async (req: FastifyRequest): Promise<any> => {
        return this.authService.validateCookiesCasbin(req);
    };
}
