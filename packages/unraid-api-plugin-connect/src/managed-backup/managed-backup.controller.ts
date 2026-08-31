import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Post,
    ServiceUnavailableException,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';
import { IsString, MaxLength } from 'class-validator';

import { InvalidRecoveryPhraseError, ManagedBackupService } from './managed-backup.service.js';

class ManagedBackupSetupInput {
    @IsString()
    @MaxLength(256)
    recoveryPhrase!: string;
}

@Controller('/graphql/api/connect/managed-backup')
export class ManagedBackupController {
    constructor(private readonly backup: ManagedBackupService) {}

    @Get('/status')
    @UsePermissions({ action: AuthAction.READ_ANY, resource: Resource.FLASH })
    async status(): Promise<unknown> {
        try {
            return await this.backup.status();
        } catch {
            throw new ServiceUnavailableException('Managed backup status is unavailable');
        }
    }

    @Post('/setup')
    @UsePermissions({ action: AuthAction.UPDATE_ANY, resource: Resource.FLASH })
    @UsePipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
            validationError: { target: false, value: false },
        })
    )
    async setup(@Body() input: ManagedBackupSetupInput): Promise<unknown> {
        try {
            return await this.backup.setup(input.recoveryPhrase);
        } catch (error) {
            if (error instanceof InvalidRecoveryPhraseError) {
                throw new BadRequestException(
                    'Enter a recovery phrase without leading or trailing whitespace.'
                );
            }
            throw new ServiceUnavailableException(
                'Managed backup could not be prepared. Check your Connect plan and try again.'
            );
        }
    }

    @Post('/run')
    @UsePermissions({ action: AuthAction.UPDATE_ANY, resource: Resource.FLASH })
    run() {
        return this.backup.startBackup();
    }
}
