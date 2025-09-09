import { ConfigService } from '@nestjs/config';
import { CronExpression } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';

import { ValidationError } from 'class-validator';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '@app/core/errors/app-error.js';
import { DockerConfigService } from '@app/unraid-api/graph/resolvers/docker/docker-config.service.js';

vi.mock('cron', () => ({
    validateCronExpression: vi.fn(),
}));

vi.mock('@app/unraid-api/graph/resolvers/validation.utils.js', () => ({
    validateObject: vi.fn(),
}));

describe('DockerConfigService - validate', () => {
    let service: DockerConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DockerConfigService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: vi.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<DockerConfigService>(DockerConfigService);
        vi.clearAllMocks();
    });

    describe('validate', () => {
        it('should validate and return docker config for valid cron expression', async () => {
            const inputConfig = { updateCheckCronSchedule: '0 6 * * *' };
            const validatedConfig = { updateCheckCronSchedule: '0 6 * * *' };

            const { validateObject } = await import(
                '@app/unraid-api/graph/resolvers/validation.utils.js'
            );
            const { validateCronExpression } = await import('cron');

            vi.mocked(validateObject).mockResolvedValue(validatedConfig);
            vi.mocked(validateCronExpression).mockReturnValue({ valid: true });

            const result = await service.validate(inputConfig);

            expect(validateObject).toHaveBeenCalledWith(expect.any(Function), inputConfig);
            expect(validateCronExpression).toHaveBeenCalledWith('0 6 * * *');
            expect(result).toBe(validatedConfig);
        });

        it('should validate and return docker config for predefined cron expression', async () => {
            const inputConfig = { updateCheckCronSchedule: CronExpression.EVERY_DAY_AT_6AM };
            const validatedConfig = { updateCheckCronSchedule: CronExpression.EVERY_DAY_AT_6AM };

            const { validateObject } = await import(
                '@app/unraid-api/graph/resolvers/validation.utils.js'
            );
            const { validateCronExpression } = await import('cron');

            vi.mocked(validateObject).mockResolvedValue(validatedConfig);
            vi.mocked(validateCronExpression).mockReturnValue({ valid: true });

            const result = await service.validate(inputConfig);

            expect(validateObject).toHaveBeenCalledWith(expect.any(Function), inputConfig);
            expect(validateCronExpression).toHaveBeenCalledWith(CronExpression.EVERY_DAY_AT_6AM);
            expect(result).toBe(validatedConfig);
        });

        it('should throw AppError for invalid cron expression', async () => {
            const inputConfig = { updateCheckCronSchedule: 'invalid-cron' };
            const validatedConfig = { updateCheckCronSchedule: 'invalid-cron' };

            const { validateObject } = await import(
                '@app/unraid-api/graph/resolvers/validation.utils.js'
            );
            const { validateCronExpression } = await import('cron');

            vi.mocked(validateObject).mockResolvedValue(validatedConfig);
            vi.mocked(validateCronExpression).mockReturnValue({ valid: false });

            await expect(service.validate(inputConfig)).rejects.toThrow(
                new AppError('Cron expression not supported: invalid-cron')
            );

            expect(validateObject).toHaveBeenCalledWith(expect.any(Function), inputConfig);
            expect(validateCronExpression).toHaveBeenCalledWith('invalid-cron');
        });

        it('should throw AppError for empty cron expression', async () => {
            const inputConfig = { updateCheckCronSchedule: '' };
            const validatedConfig = { updateCheckCronSchedule: '' };

            const { validateObject } = await import(
                '@app/unraid-api/graph/resolvers/validation.utils.js'
            );
            const { validateCronExpression } = await import('cron');

            vi.mocked(validateObject).mockResolvedValue(validatedConfig);
            vi.mocked(validateCronExpression).mockReturnValue({ valid: false });

            await expect(service.validate(inputConfig)).rejects.toThrow(
                new AppError('Cron expression not supported: ')
            );

            expect(validateObject).toHaveBeenCalledWith(expect.any(Function), inputConfig);
            expect(validateCronExpression).toHaveBeenCalledWith('');
        });

        it('should throw AppError for malformed cron expression', async () => {
            const inputConfig = { updateCheckCronSchedule: '* * * *' };
            const validatedConfig = { updateCheckCronSchedule: '* * * *' };

            const { validateObject } = await import(
                '@app/unraid-api/graph/resolvers/validation.utils.js'
            );
            const { validateCronExpression } = await import('cron');

            vi.mocked(validateObject).mockResolvedValue(validatedConfig);
            vi.mocked(validateCronExpression).mockReturnValue({ valid: false });

            await expect(service.validate(inputConfig)).rejects.toThrow(
                new AppError('Cron expression not supported: * * * *')
            );

            expect(validateObject).toHaveBeenCalledWith(expect.any(Function), inputConfig);
            expect(validateCronExpression).toHaveBeenCalledWith('* * * *');
        });

        it('should propagate validation errors from validateObject', async () => {
            const inputConfig = { updateCheckCronSchedule: '0 6 * * *' };
            const validationError = new ValidationError();
            validationError.property = 'updateCheckCronSchedule';

            const { validateObject } = await import(
                '@app/unraid-api/graph/resolvers/validation.utils.js'
            );

            vi.mocked(validateObject).mockRejectedValue(validationError);

            await expect(service.validate(inputConfig)).rejects.toThrow();

            expect(validateObject).toHaveBeenCalledWith(expect.any(Function), inputConfig);
        });

        it('should handle complex valid cron expressions', async () => {
            const inputConfig = { updateCheckCronSchedule: '0 0,12 * * 1-5' };
            const validatedConfig = { updateCheckCronSchedule: '0 0,12 * * 1-5' };

            const { validateObject } = await import(
                '@app/unraid-api/graph/resolvers/validation.utils.js'
            );
            const { validateCronExpression } = await import('cron');

            vi.mocked(validateObject).mockResolvedValue(validatedConfig);
            vi.mocked(validateCronExpression).mockReturnValue({ valid: true });

            const result = await service.validate(inputConfig);

            expect(validateObject).toHaveBeenCalledWith(expect.any(Function), inputConfig);
            expect(validateCronExpression).toHaveBeenCalledWith('0 0,12 * * 1-5');
            expect(result).toBe(validatedConfig);
        });

        it('should handle input with extra properties', async () => {
            const inputConfig = {
                updateCheckCronSchedule: '0 6 * * *',
                extraProperty: 'should be ignored',
            };
            const validatedConfig = { updateCheckCronSchedule: '0 6 * * *' };

            const { validateObject } = await import(
                '@app/unraid-api/graph/resolvers/validation.utils.js'
            );
            const { validateCronExpression } = await import('cron');

            vi.mocked(validateObject).mockResolvedValue(validatedConfig);
            vi.mocked(validateCronExpression).mockReturnValue({ valid: true });

            const result = await service.validate(inputConfig);

            expect(validateObject).toHaveBeenCalledWith(expect.any(Function), inputConfig);
            expect(validateCronExpression).toHaveBeenCalledWith('0 6 * * *');
            expect(result).toBe(validatedConfig);
        });
    });
});
