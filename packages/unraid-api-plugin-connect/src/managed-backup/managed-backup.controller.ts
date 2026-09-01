import {
    BadRequestException,
    Body,
    ConflictException,
    Controller,
    Get,
    Post,
    ServiceUnavailableException,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

import {
    InvalidRecoveryPhraseError,
    ManagedBackupBusyError,
    ManagedBackupService,
} from './managed-backup.service.js';

class ManagedBackupSetupInput {
    @IsString()
    @MaxLength(256)
    recoveryPhrase!: string;
}

class ManagedBackupUnlockInput {
    @IsOptional()
    @IsBoolean()
    removeAll = false;
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

    @Get('/locks')
    @UsePermissions({ action: AuthAction.READ_ANY, resource: Resource.FLASH })
    async locks(): Promise<unknown> {
        try {
            return await this.backup.listLocks();
        } catch {
            throw new ServiceUnavailableException('Repository locks could not be loaded');
        }
    }

    @Post('/unlock')
    @UsePermissions({ action: AuthAction.UPDATE_ANY, resource: Resource.FLASH })
    @UsePipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
            validationError: { target: false, value: false },
        })
    )
    async unlock(@Body() input: ManagedBackupUnlockInput): Promise<unknown> {
        try {
            return await this.backup.unlock(input.removeAll);
        } catch (error) {
            if (error instanceof ManagedBackupBusyError) {
                throw new ConflictException('Wait for the current backup to finish before unlocking');
            }
            throw new ServiceUnavailableException('Repository locks could not be removed');
        }
    }
}
