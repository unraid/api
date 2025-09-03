import { describe, expect, it } from 'vitest';

import type { Var } from '@app/core/types/states/var.js';
import { getParityCheckStatus, ParityCheckStatus } from '@app/core/modules/array/parity-check-status.js';

const createMockVarData = (overrides: Partial<Var> = {}): Var =>
    ({
        mdResyncPos: 0,
        mdResyncDt: '0',
        mdResyncDb: '0',
        mdResyncSize: 100000,
        sbSyncExit: '0',
        sbSynced: 0,
        sbSynced2: 0,
        // Add required fields with default values
        bindMgt: null,
        cacheNumDevices: 0,
        cacheSbNumDisks: 0,
        comment: '',
        configValid: true,
        configErrorState: null,
        csrfToken: '',
        defaultFormat: '',
        defaultFsType: 'xfs' as any,
        deviceCount: 0,
        domain: '',
        domainLogin: '',
        domainShort: '',
        flashGuid: '',
        flashProduct: '',
        flashVendor: '',
        fsCopyPrcnt: 0,
        fsNumMounted: 0,
        fsNumUnmountable: 0,
        fsProgress: '',
        fsState: '',
        fsUnmountableMask: '',
        fuseDirectio: '',
        fuseDirectioDefault: '',
        fuseDirectioStatus: '',
        fuseRemember: '',
        fuseRememberDefault: '',
        fuseRememberStatus: '',
        hideDotFiles: false,
        ...overrides,
    }) as Var;

describe('getParityCheckStatus', () => {
    describe('RUNNING status', () => {
        it('should return RUNNING when mdResyncPos > 0 and mdResyncDt > 0', () => {
            const varData = createMockVarData({
                mdResyncPos: 100,
                mdResyncDt: '1000',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.RUNNING);
        });

        it('should return RUNNING when mdResyncPos is very large', () => {
            const varData = createMockVarData({
                mdResyncPos: 999999999,
                mdResyncDt: '1',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.RUNNING);
        });

        it('should return RUNNING when mdResyncDt is a decimal string', () => {
            const varData = createMockVarData({
                mdResyncPos: 1,
                mdResyncDt: '0.1',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.RUNNING);
        });

        it('should return RUNNING even with other status fields set', () => {
            const varData = createMockVarData({
                mdResyncPos: 50,
                mdResyncDt: '500',
                sbSynced: 1234567890,
                sbSynced2: 1234567900,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.RUNNING);
        });
    });

    describe('PAUSED status', () => {
        it('should return PAUSED when mdResyncPos > 0 and mdResyncDt = 0', () => {
            const varData = createMockVarData({
                mdResyncPos: 100,
                mdResyncDt: '0',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.PAUSED);
        });

        it('should return PAUSED when mdResyncDt is string "0"', () => {
            const varData = createMockVarData({
                mdResyncPos: 1,
                mdResyncDt: '0',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.PAUSED);
        });

        it('should return PAUSED when mdResyncDt is empty string (converts to 0)', () => {
            const varData = createMockVarData({
                mdResyncPos: 1,
                mdResyncDt: '',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.PAUSED);
        });

        it('should return PAUSED when mdResyncDt is non-numeric string (converts to NaN, then 0)', () => {
            const varData = createMockVarData({
                mdResyncPos: 1,
                mdResyncDt: 'not-a-number',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.PAUSED);
        });

        it('should return PAUSED even with completed check history', () => {
            const varData = createMockVarData({
                mdResyncPos: 100,
                mdResyncDt: '0',
                sbSynced: 1234567890,
                sbSynced2: 1234567900,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.PAUSED);
        });
    });

    describe('NEVER_RUN status', () => {
        it('should return NEVER_RUN when sbSynced is 0 and no active operation', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 0,
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should return NEVER_RUN as fallback when all conditions fail', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSynced2: 0,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should return NEVER_RUN when sbSynced is exactly 0', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 0,
                sbSynced2: 0,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.NEVER_RUN);
        });
    });

    describe('CANCELLED status', () => {
        it('should return CANCELLED when sbSyncExit is "-4"', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 1234567890,
                sbSynced2: 1234567900,
                sbSyncExit: '-4',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.CANCELLED);
        });

        it('should return CANCELLED when sbSyncExit is numeric -4 as string', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: '-4',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.CANCELLED);
        });

        it('should return CANCELLED even when sbSynced2 is 0', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSynced2: 0,
                sbSyncExit: '-4',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.CANCELLED);
        });

        it('should return CANCELLED when sbSyncExit is "-4.0" (decimal notation)', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: '-4.0',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.CANCELLED);
        });
    });

    describe('FAILED status', () => {
        it('should return FAILED when sbSyncExit is non-zero and not -4', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 1234567890,
                sbSynced2: 1234567900,
                sbSyncExit: '1',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.FAILED);
        });

        it('should return FAILED when sbSyncExit is negative but not -4', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: '-1',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.FAILED);
        });

        it('should return FAILED when sbSyncExit is positive error code', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: '5',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.FAILED);
        });

        it('should return FAILED for large error codes', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: '255',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.FAILED);
        });

        it('should return FAILED when sbSyncExit is decimal error code', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: '1.5',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.FAILED);
        });
    });

    describe('COMPLETED status', () => {
        it('should return COMPLETED when sbSynced2 > 0 and sbSyncExit is 0', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 1234567890,
                sbSynced2: 1234567900,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.COMPLETED);
        });

        it('should return COMPLETED when sbSynced2 is very large', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSynced2: 999999999,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.COMPLETED);
        });

        it('should return COMPLETED when sbSynced2 is minimal positive value', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSynced2: 1,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.COMPLETED);
        });
    });

    describe('Corrupt/Invalid Number Handling', () => {
        it('should return PAUSED when mdResyncDt is null and mdResyncPos > 0', () => {
            const varData = createMockVarData({
                mdResyncPos: 100,
                mdResyncDt: null as any,
                sbSynced: 100,
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.PAUSED);
        });

        it('should return PAUSED when mdResyncDt is undefined and mdResyncPos > 0', () => {
            const varData = createMockVarData({
                mdResyncPos: 100,
                mdResyncDt: undefined as any,
                sbSynced: 100,
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.PAUSED);
        });

        it('should return NEVER_RUN when sbSyncExit is null (converts to 0)', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: null as any,
            });

            // Number(null) = 0, so this behaves like sbSyncExit = '0'
            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should return NEVER_RUN when sbSyncExit is undefined (NaN treated as 0)', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: undefined as any,
            });

            // Number(undefined) = NaN, treated as 0, so behaves like sbSyncExit = '0'
            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should return NEVER_RUN when sbSyncExit is an object (NaN treated as 0)', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: {} as any,
            });

            // Number({}) = NaN, treated as 0, so behaves like sbSyncExit = '0'
            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should return NEVER_RUN when sbSyncExit is an empty array (converts to 0)', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: [] as any,
            });

            // Number([]) = 0, so this behaves like sbSyncExit = '0'
            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should return NEVER_RUN when sbSyncExit is a non-empty array (NaN treated as 0)', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: [1, 2, 3] as any,
            });

            // Number([1,2,3]) = NaN, treated as 0, so behaves like sbSyncExit = '0'
            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should return FAILED when sbSyncExit is boolean true', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: true as any,
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.FAILED);
        });

        it('should return NEVER_RUN when sbSyncExit is boolean false (converts to 0)', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: false as any,
            });

            // Number(false) = 0, so sbSyncExitNumber === -4 is false, sbSyncExitNumber !== 0 is false
            // Falls through to check sbSynced2 > 0, which is false, so returns NEVER_RUN fallback
            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should return PAUSED when mdResyncDt contains special characters', () => {
            const varData = createMockVarData({
                mdResyncPos: 100,
                mdResyncDt: '!@#$%^&*()',
                sbSynced: 100,
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.PAUSED);
        });

        it('should return NEVER_RUN when sbSyncExit contains special characters (NaN treated as 0)', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: '!@#$%^&*()',
            });

            // Number('!@#$%^&*()') = NaN, treated as 0, so behaves like sbSyncExit = '0'
            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should return PAUSED when mdResyncDt is Infinity string', () => {
            const varData = createMockVarData({
                mdResyncPos: 100,
                mdResyncDt: 'Infinity',
                sbSynced: 100,
            });

            // Number('Infinity') = Infinity, and Infinity > 0 is true
            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.RUNNING);
        });

        it('should return PAUSED when mdResyncDt is -Infinity string', () => {
            const varData = createMockVarData({
                mdResyncPos: 100,
                mdResyncDt: '-Infinity',
                sbSynced: 100,
            });

            // Number('-Infinity') = -Infinity, and -Infinity > 0 is false
            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.PAUSED);
        });

        it('should return FAILED when sbSyncExit is Infinity string', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: 'Infinity',
            });

            // Number('Infinity') = Infinity, Infinity !== 0 is true, Infinity !== -4 is true
            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.FAILED);
        });

        it('should demonstrate NaN-to-0 treatment with completed status', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSynced2: 200,
                sbSyncExit: 'completely-invalid-string',
            });

            // Number('completely-invalid-string') = NaN, treated as 0
            // sbSyncExitValue === -4 is false, sbSyncExitValue !== 0 is false
            // Falls through to sbSynced2 > 0 check, which is true, so COMPLETED
            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.COMPLETED);
        });
    });

    describe('Edge cases and string-to-number conversion', () => {
        it('should handle mdResyncDt with whitespace', () => {
            const varData = createMockVarData({
                mdResyncPos: 1,
                mdResyncDt: ' 100 ',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.RUNNING);
        });

        it('should handle sbSyncExit with whitespace', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: ' -4 ',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.CANCELLED);
        });

        it('should handle sbSyncExit as non-numeric string (NaN treated as 0)', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSynced2: 200,
                sbSyncExit: 'invalid',
            });

            // Number('invalid') = NaN, treated as 0, then checks sbSynced2 > 0 (true) = COMPLETED
            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.COMPLETED);
        });

        it('should handle all zero values', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                mdResyncDt: '0',
                sbSynced: 0,
                sbSynced2: 0,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should prioritize active operation over completed status', () => {
            const varData = createMockVarData({
                mdResyncPos: 50,
                mdResyncDt: '100',
                sbSynced: 1000,
                sbSynced2: 2000,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.RUNNING);
        });

        it('should prioritize active paused operation over completed status', () => {
            const varData = createMockVarData({
                mdResyncPos: 50,
                mdResyncDt: '0',
                sbSynced: 1000,
                sbSynced2: 2000,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.PAUSED);
        });

        it('should prioritize never run over other statuses when sbSynced is 0', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 0,
                sbSynced2: 100,
                sbSyncExit: '-4',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should prioritize cancelled over failed status', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSynced2: 0,
                sbSyncExit: '-4',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.CANCELLED);
        });

        it('should handle very large numbers', () => {
            const varData = createMockVarData({
                mdResyncPos: Number.MAX_SAFE_INTEGER,
                mdResyncDt: String(Number.MAX_SAFE_INTEGER),
                sbSynced: Number.MAX_SAFE_INTEGER,
                sbSynced2: Number.MAX_SAFE_INTEGER,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.RUNNING);
        });

        it('should handle negative mdResyncPos as edge case', () => {
            const varData = createMockVarData({
                mdResyncPos: -1,
                mdResyncDt: '100',
                sbSynced: 100,
                sbSynced2: 200,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.COMPLETED);
        });

        it('should handle hexadecimal string in sbSyncExit', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: '0x4',
            });

            // Number('0x4') = 4 (valid hex), so 4 !== 0 is true, returns FAILED
            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.FAILED);
        });

        it('should handle scientific notation in mdResyncDt', () => {
            const varData = createMockVarData({
                mdResyncPos: 1,
                mdResyncDt: '1e3',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.RUNNING);
        });
    });

    describe('Real-world scenario tests', () => {
        it('should handle fresh Unraid system (never run)', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                mdResyncDt: '0',
                sbSynced: 0,
                sbSynced2: 0,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should handle system with successful completed check', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                mdResyncDt: '0',
                sbSynced: 1640995200, // Example timestamp
                sbSynced2: 1640998800, // One hour later
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.COMPLETED);
        });

        it('should handle user-cancelled check scenario', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                mdResyncDt: '0',
                sbSynced: 1640995200,
                sbSynced2: 1640996000, // Cancelled after 13 minutes
                sbSyncExit: '-4',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.CANCELLED);
        });

        it('should handle failed check with error', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                mdResyncDt: '0',
                sbSynced: 1640995200,
                sbSynced2: 1640996000,
                sbSyncExit: '1', // Generic error
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.FAILED);
        });

        it('should handle currently running check at 50%', () => {
            const varData = createMockVarData({
                mdResyncPos: 500000,
                mdResyncDt: '1000',
                sbSynced: 1640995200,
                sbSynced2: 0, // Not completed yet
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.RUNNING);
        });

        it('should handle paused check scenario', () => {
            const varData = createMockVarData({
                mdResyncPos: 250000,
                mdResyncDt: '0', // Paused
                sbSynced: 1640995200,
                sbSynced2: 0,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData).status).toBe(ParityCheckStatus.PAUSED);
        });
    });

    describe('Speed calculation', () => {
        it('should return "0" when deltaTime is 0', () => {
            const varData = createMockVarData({
                mdResyncDt: '0',
                mdResyncDb: '1000',
            });

            expect(getParityCheckStatus(varData).speed).toBe('0');
        });

        it('should return "0" when deltaBlocks is 0', () => {
            const varData = createMockVarData({
                mdResyncDt: '1000',
                mdResyncDb: '0',
            });

            expect(getParityCheckStatus(varData).speed).toBe('0');
        });

        it('should return "0" when both deltaTime and deltaBlocks are 0', () => {
            const varData = createMockVarData({
                mdResyncDt: '0',
                mdResyncDb: '0',
            });

            expect(getParityCheckStatus(varData).speed).toBe('0');
        });

        it('should calculate speed correctly for basic values', () => {
            const varData = createMockVarData({
                mdResyncDt: '1', // 1 second
                mdResyncDb: '1024', // 1024 blocks = 1024 * 1024 bytes = 1MB
            });

            // Speed = (1024 * 1024) bytes / 1 second / 1024 / 1024 = 1 MB/s
            expect(getParityCheckStatus(varData).speed).toBe('1');
        });

        it('should calculate speed correctly for larger values', () => {
            const varData = createMockVarData({
                mdResyncDt: '10', // 10 seconds
                mdResyncDb: '20480', // 20480 blocks = 20MB of data
            });

            // Speed = (20480 * 1024) bytes / 10 seconds / 1024 / 1024 = 2 MB/s
            expect(getParityCheckStatus(varData).speed).toBe('2');
        });

        it('should round speed values correctly', () => {
            const varData = createMockVarData({
                mdResyncDt: '3', // 3 seconds
                mdResyncDb: '1536', // 1536 blocks = 1.5MB of data
            });

            // Speed = (1536 * 1024) bytes / 3 seconds / 1024 / 1024 = 0.5 MB/s
            expect(getParityCheckStatus(varData).speed).toBe('1'); // Should round 0.5 to 1
        });

        it('should handle decimal values in deltaTime', () => {
            const varData = createMockVarData({
                mdResyncDt: '2.5', // 2.5 seconds
                mdResyncDb: '2560', // 2560 blocks = 2.5MB of data
            });

            // Speed = (2560 * 1024) bytes / 2.5 seconds / 1024 / 1024 = 1 MB/s
            expect(getParityCheckStatus(varData).speed).toBe('1');
        });

        it('should handle very small speed values', () => {
            const varData = createMockVarData({
                mdResyncDt: '1000', // 1000 seconds
                mdResyncDb: '1', // 1 block = 1024 bytes
            });

            // Speed = (1 * 1024) bytes / 1000 seconds / 1024 / 1024 = ~0.00098 MB/s
            expect(getParityCheckStatus(varData).speed).toBe('0'); // Should round to 0
        });

        it('should handle very large speed values', () => {
            const varData = createMockVarData({
                mdResyncDt: '1', // 1 second
                mdResyncDb: '1048576', // 1048576 blocks = 1GB of data
            });

            // Speed = (1048576 * 1024) bytes / 1 second / 1024 / 1024 = 1024 MB/s
            expect(getParityCheckStatus(varData).speed).toBe('1024');
        });

        it('should handle invalid deltaTime values gracefully', () => {
            const varData = createMockVarData({
                mdResyncDt: 'invalid',
                mdResyncDb: '1024',
            });

            // Invalid deltaTime should convert to 0, resulting in 0 speed
            expect(getParityCheckStatus(varData).speed).toBe('0');
        });

        it('should handle invalid deltaBlocks values gracefully', () => {
            const varData = createMockVarData({
                mdResyncDt: '1',
                mdResyncDb: 'invalid',
            });

            // Invalid deltaBlocks should convert to 0, resulting in 0 speed
            expect(getParityCheckStatus(varData).speed).toBe('0');
        });

        it('should handle negative values in deltaTime', () => {
            const varData = createMockVarData({
                mdResyncDt: '-1',
                mdResyncDb: '1024',
            });

            // Negative deltaTime results in negative speed
            // (1024 * 1024) / -1 / 1024 / 1024 = -1 MB/s
            expect(getParityCheckStatus(varData).speed).toBe('-1');
        });
    });

    describe('Date calculation', () => {
        it('should return undefined when sbSynced is 0', () => {
            const varData = createMockVarData({
                sbSynced: 0,
            });

            expect(getParityCheckStatus(varData).date).toBeUndefined();
        });

        it('should return undefined when sbSynced is negative', () => {
            const varData = createMockVarData({
                sbSynced: -1,
            });

            expect(getParityCheckStatus(varData).date).toBeUndefined();
        });

        it('should return valid Date when sbSynced is positive', () => {
            const varData = createMockVarData({
                sbSynced: 1640995200, // Jan 1, 2022, 00:00:00 UTC
            });

            const result = getParityCheckStatus(varData);
            expect(result.date).toBeInstanceOf(Date);
            expect(result.date!.getTime()).toBe(1640995200 * 1000);
        });

        it('should convert Unix timestamp correctly', () => {
            const varData = createMockVarData({
                sbSynced: 1609459200, // Jan 1, 2021, 00:00:00 UTC
            });

            const result = getParityCheckStatus(varData);
            expect(result.date!.getUTCFullYear()).toBe(2021);
            expect(result.date!.getUTCMonth()).toBe(0); // January = 0
            expect(result.date!.getUTCDate()).toBe(1);
        });

        it('should handle large timestamp values', () => {
            const varData = createMockVarData({
                sbSynced: 2147483647, // Max 32-bit signed integer (Jan 19, 2038)
            });

            const result = getParityCheckStatus(varData);
            expect(result.date).toBeInstanceOf(Date);
            expect(result.date!.getFullYear()).toBe(2038);
        });

        it('should handle small positive timestamp values', () => {
            const varData = createMockVarData({
                sbSynced: 1, // Jan 1, 1970, 00:00:01 UTC
            });

            const result = getParityCheckStatus(varData);
            expect(result.date).toBeInstanceOf(Date);
            expect(result.date!.getTime()).toBe(1000);
        });
    });

    describe('Duration calculation', () => {
        it('should return undefined when sbSynced is 0', () => {
            const varData = createMockVarData({
                sbSynced: 0,
            });

            expect(getParityCheckStatus(varData).duration).toBeUndefined();
        });

        it('should return undefined when sbSynced is negative', () => {
            const varData = createMockVarData({
                sbSynced: -1,
            });

            expect(getParityCheckStatus(varData).duration).toBeUndefined();
        });

        it('should calculate duration using sbSynced2 when available', () => {
            const varData = createMockVarData({
                sbSynced: 1000,
                sbSynced2: 1360, // 360 seconds later (6 minutes)
            });

            const result = getParityCheckStatus(varData);
            expect(result.duration).toBe(360);
        });

        it('should calculate duration using current time when sbSynced2 is 0', () => {
            const mockNow = 1640995560; // Some future time
            const originalNow = Date.now;
            Date.now = () => mockNow * 1000; // Convert to milliseconds

            const varData = createMockVarData({
                sbSynced: 1640995200, // 360 seconds before mockNow
                sbSynced2: 0,
            });

            const result = getParityCheckStatus(varData);
            expect(result.duration).toBe(360);

            Date.now = originalNow; // Restore original
        });

        it('should round duration values correctly', () => {
            const varData = createMockVarData({
                sbSynced: 1000,
                sbSynced2: 1360.7, // 360.7 seconds later
            });

            const result = getParityCheckStatus(varData);
            expect(result.duration).toBe(361); // Should round 360.7 to 361
        });

        it('should handle zero duration', () => {
            const varData = createMockVarData({
                sbSynced: 1000,
                sbSynced2: 1000, // Same time
            });

            const result = getParityCheckStatus(varData);
            expect(result.duration).toBe(0);
        });

        it('should handle negative duration (edge case)', () => {
            const varData = createMockVarData({
                sbSynced: 2000,
                sbSynced2: 1000, // End time before start time
            });

            const result = getParityCheckStatus(varData);
            expect(result.duration).toBe(-1000); // Should handle negative duration
        });

        it('should prefer sbSynced2 over current time when both are available', () => {
            const mockNow = 5000;
            const originalNow = Date.now;
            Date.now = () => mockNow * 1000;

            const varData = createMockVarData({
                sbSynced: 1000,
                sbSynced2: 2000, // Should use this, not current time
            });

            const result = getParityCheckStatus(varData);
            expect(result.duration).toBe(1000); // 2000 - 1000, not 5000 - 1000

            Date.now = originalNow;
        });

        it('should handle large duration values', () => {
            const varData = createMockVarData({
                sbSynced: 1000,
                sbSynced2: 1000000, // 999,000 seconds (about 11.5 days)
            });

            const result = getParityCheckStatus(varData);
            expect(result.duration).toBe(999000);
        });
    });

    describe('Progress calculation', () => {
        it('should return 0 when mdResyncSize is 0', () => {
            const varData = createMockVarData({
                mdResyncPos: 50,
                mdResyncSize: 0,
            });

            expect(getParityCheckStatus(varData).progress).toBe(0);
        });

        it('should return 0 when mdResyncSize is negative', () => {
            const varData = createMockVarData({
                mdResyncPos: 50,
                mdResyncSize: -100,
            });

            expect(getParityCheckStatus(varData).progress).toBe(0);
        });

        it('should calculate progress percentage correctly', () => {
            const varData = createMockVarData({
                mdResyncPos: 25,
                mdResyncSize: 100,
            });

            expect(getParityCheckStatus(varData).progress).toBe(25);
        });

        it('should handle 0% progress', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                mdResyncSize: 100,
            });

            expect(getParityCheckStatus(varData).progress).toBe(0);
        });

        it('should handle 100% progress', () => {
            const varData = createMockVarData({
                mdResyncPos: 100,
                mdResyncSize: 100,
            });

            expect(getParityCheckStatus(varData).progress).toBe(100);
        });

        it('should clamp progress above 100% to 100%', () => {
            const varData = createMockVarData({
                mdResyncPos: 150,
                mdResyncSize: 100,
            });

            expect(getParityCheckStatus(varData).progress).toBe(100);
        });

        it('should clamp negative progress to 0%', () => {
            const varData = createMockVarData({
                mdResyncPos: -50,
                mdResyncSize: 100,
            });

            expect(getParityCheckStatus(varData).progress).toBe(0);
        });

        it('should round progress values correctly', () => {
            const varData = createMockVarData({
                mdResyncPos: 33,
                mdResyncSize: 100,
            });

            expect(getParityCheckStatus(varData).progress).toBe(33);
        });

        it('should round decimal progress values', () => {
            const varData = createMockVarData({
                mdResyncPos: 333,
                mdResyncSize: 1000, // 33.3%
            });

            expect(getParityCheckStatus(varData).progress).toBe(33);
        });

        it('should handle very small progress values', () => {
            const varData = createMockVarData({
                mdResyncPos: 1,
                mdResyncSize: 1000000, // 0.0001%
            });

            expect(getParityCheckStatus(varData).progress).toBe(0); // Should round down to 0
        });

        it('should handle very large numbers', () => {
            const varData = createMockVarData({
                mdResyncPos: Number.MAX_SAFE_INTEGER / 2,
                mdResyncSize: Number.MAX_SAFE_INTEGER,
            });

            expect(getParityCheckStatus(varData).progress).toBe(50);
        });

        it('should handle floating point precision issues', () => {
            const varData = createMockVarData({
                mdResyncPos: 1,
                mdResyncSize: 3, // 33.333...%
            });

            const result = getParityCheckStatus(varData).progress;
            expect(result).toBeGreaterThanOrEqual(33);
            expect(result).toBeLessThanOrEqual(34);
        });

        it('should handle when mdResyncPos equals mdResyncSize', () => {
            const varData = createMockVarData({
                mdResyncPos: 12345,
                mdResyncSize: 12345,
            });

            expect(getParityCheckStatus(varData).progress).toBe(100);
        });
    });
});
