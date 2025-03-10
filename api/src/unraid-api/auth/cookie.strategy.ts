import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { Strategy } from 'passport-custom';

import { AuthService } from '@app/unraid-api/auth/auth.service.js';
import { FastifyRequest } from '@app/unraid-api/types/fastify.js';

const strategyName = 'user-cookie';

@Injectable()
export class UserCookieStrategy extends PassportStrategy(Strategy, strategyName) {
    static key = strategyName;

    constructor(private authService: AuthService) {
        super();
    }

    public validate = async (request: FastifyRequest): Promise<any> => {
        return this.authService.validateCookiesCasbin(request);
    };
}
