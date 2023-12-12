import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '@app/unraid-api/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { ServerHeaderStrategy } from '@app/unraid-api/auth/header.strategy';

@Module({
    imports: [UsersModule, PassportModule],
    providers: [AuthService, ServerHeaderStrategy],
})
export class AuthModule {}
