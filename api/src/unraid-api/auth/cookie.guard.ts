import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CookieService } from './cookie.service';

@Injectable()
export class CookieGuard implements CanActivate {
    constructor(private service: CookieService) {}

    /**
     * Checks if the request contains a valid unraid session cookie.
     *
     * If it does, it means the user is logged into their unraid server.
     * They should be allowed to access it from an any domain, regardless of CORS
     * (although that logic doesn't happen here).
     */
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        return this.service.hasValidAuthCookie(request.cookies);
    }
}
