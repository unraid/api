import { Test, type TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '@app/unraid-api/auth/users.service';
import { CookieService } from '@app/unraid-api/auth/cookie.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
        providers: [
            AuthService,
            { provide: 'USERS_SERVICE', useClass: UsersService },
            { provide: 'COOKIE_SERVICE', useClass: CookieService },
            { provide: 'SESSION_COOKIE_CONFIG', useValue: { name: 'session' } },
        ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
