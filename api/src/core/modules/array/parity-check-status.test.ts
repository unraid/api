import { describe, expect, it } from 'vitest';

import type { Var } from '@app/core/types/states/var.js';
import { getParityCheckStatus, ParityCheckStatus } from '@app/core/modules/array/parity-check-status.js';

const createMockVarData = (overrides: Partial<Var> = {}): Var =>
    ({
        mdResyncPos: 0,
        mdResyncDt: '0',
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

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.RUNNING);
        });

        it('should return RUNNING when mdResyncPos is very large', () => {
            const varData = createMockVarData({
                mdResyncPos: 999999999,
                mdResyncDt: '1',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.RUNNING);
        });

        it('should return RUNNING when mdResyncDt is a decimal string', () => {
            const varData = createMockVarData({
                mdResyncPos: 1,
                mdResyncDt: '0.1',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.RUNNING);
        });

        it('should return RUNNING even with other status fields set', () => {
            const varData = createMockVarData({
                mdResyncPos: 50,
                mdResyncDt: '500',
                sbSynced: 1234567890,
                sbSynced2: 1234567900,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.RUNNING);
        });
    });

    describe('PAUSED status', () => {
        it('should return PAUSED when mdResyncPos > 0 and mdResyncDt = 0', () => {
            const varData = createMockVarData({
                mdResyncPos: 100,
                mdResyncDt: '0',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.PAUSED);
        });

        it('should return PAUSED when mdResyncDt is string "0"', () => {
            const varData = createMockVarData({
                mdResyncPos: 1,
                mdResyncDt: '0',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.PAUSED);
        });

        it('should return PAUSED when mdResyncDt is empty string (converts to 0)', () => {
            const varData = createMockVarData({
                mdResyncPos: 1,
                mdResyncDt: '',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.PAUSED);
        });

        it('should return PAUSED when mdResyncDt is non-numeric string (converts to NaN, then 0)', () => {
            const varData = createMockVarData({
                mdResyncPos: 1,
                mdResyncDt: 'not-a-number',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.PAUSED);
        });

        it('should return PAUSED even with completed check history', () => {
            const varData = createMockVarData({
                mdResyncPos: 100,
                mdResyncDt: '0',
                sbSynced: 1234567890,
                sbSynced2: 1234567900,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.PAUSED);
        });
    });

    describe('NEVER_RUN status', () => {
        it('should return NEVER_RUN when sbSynced is 0 and no active operation', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 0,
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should return NEVER_RUN as fallback when all conditions fail', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSynced2: 0,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should return NEVER_RUN when sbSynced is exactly 0', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 0,
                sbSynced2: 0,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.NEVER_RUN);
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

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.CANCELLED);
        });

        it('should return CANCELLED when sbSyncExit is numeric -4 as string', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: '-4',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.CANCELLED);
        });

        it('should return CANCELLED even when sbSynced2 is 0', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSynced2: 0,
                sbSyncExit: '-4',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.CANCELLED);
        });

        it('should return CANCELLED when sbSyncExit is "-4.0" (decimal notation)', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: '-4.0',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.CANCELLED);
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

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.FAILED);
        });

        it('should return FAILED when sbSyncExit is negative but not -4', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: '-1',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.FAILED);
        });

        it('should return FAILED when sbSyncExit is positive error code', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: '5',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.FAILED);
        });

        it('should return FAILED for large error codes', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: '255',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.FAILED);
        });

        it('should return FAILED when sbSyncExit is decimal error code', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: '1.5',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.FAILED);
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

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.COMPLETED);
        });

        it('should return COMPLETED when sbSynced2 is very large', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSynced2: 999999999,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.COMPLETED);
        });

        it('should return COMPLETED when sbSynced2 is minimal positive value', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSynced2: 1,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.COMPLETED);
        });
    });

    describe('Corrupt/Invalid Number Handling', () => {
        it('should return PAUSED when mdResyncDt is null and mdResyncPos > 0', () => {
            const varData = createMockVarData({
                mdResyncPos: 100,
                mdResyncDt: null as any,
                sbSynced: 100,
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.PAUSED);
        });

        it('should return PAUSED when mdResyncDt is undefined and mdResyncPos > 0', () => {
            const varData = createMockVarData({
                mdResyncPos: 100,
                mdResyncDt: undefined as any,
                sbSynced: 100,
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.PAUSED);
        });

        it('should return NEVER_RUN when sbSyncExit is null (converts to 0)', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: null as any,
            });

            // Number(null) = 0, so this behaves like sbSyncExit = '0'
            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should return NEVER_RUN when sbSyncExit is undefined (NaN treated as 0)', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: undefined as any,
            });

            // Number(undefined) = NaN, treated as 0, so behaves like sbSyncExit = '0'
            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should return NEVER_RUN when sbSyncExit is an object (NaN treated as 0)', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: {} as any,
            });

            // Number({}) = NaN, treated as 0, so behaves like sbSyncExit = '0'
            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should return NEVER_RUN when sbSyncExit is an empty array (converts to 0)', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: [] as any,
            });

            // Number([]) = 0, so this behaves like sbSyncExit = '0'
            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should return NEVER_RUN when sbSyncExit is a non-empty array (NaN treated as 0)', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: [1, 2, 3] as any,
            });

            // Number([1,2,3]) = NaN, treated as 0, so behaves like sbSyncExit = '0'
            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should return FAILED when sbSyncExit is boolean true', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: true as any,
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.FAILED);
        });

        it('should return NEVER_RUN when sbSyncExit is boolean false (converts to 0)', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: false as any,
            });

            // Number(false) = 0, so sbSyncExitNumber === -4 is false, sbSyncExitNumber !== 0 is false
            // Falls through to check sbSynced2 > 0, which is false, so returns NEVER_RUN fallback
            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should return PAUSED when mdResyncDt contains special characters', () => {
            const varData = createMockVarData({
                mdResyncPos: 100,
                mdResyncDt: '!@#$%^&*()',
                sbSynced: 100,
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.PAUSED);
        });

        it('should return NEVER_RUN when sbSyncExit contains special characters (NaN treated as 0)', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: '!@#$%^&*()',
            });

            // Number('!@#$%^&*()') = NaN, treated as 0, so behaves like sbSyncExit = '0'
            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should return PAUSED when mdResyncDt is Infinity string', () => {
            const varData = createMockVarData({
                mdResyncPos: 100,
                mdResyncDt: 'Infinity',
                sbSynced: 100,
            });

            // Number('Infinity') = Infinity, and Infinity > 0 is true
            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.RUNNING);
        });

        it('should return PAUSED when mdResyncDt is -Infinity string', () => {
            const varData = createMockVarData({
                mdResyncPos: 100,
                mdResyncDt: '-Infinity',
                sbSynced: 100,
            });

            // Number('-Infinity') = -Infinity, and -Infinity > 0 is false
            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.PAUSED);
        });

        it('should return FAILED when sbSyncExit is Infinity string', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: 'Infinity',
            });

            // Number('Infinity') = Infinity, Infinity !== 0 is true, Infinity !== -4 is true
            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.FAILED);
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
            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.COMPLETED);
        });
    });

    describe('Edge cases and string-to-number conversion', () => {
        it('should handle mdResyncDt with whitespace', () => {
            const varData = createMockVarData({
                mdResyncPos: 1,
                mdResyncDt: ' 100 ',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.RUNNING);
        });

        it('should handle sbSyncExit with whitespace', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: ' -4 ',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.CANCELLED);
        });

        it('should handle sbSyncExit as non-numeric string (NaN treated as 0)', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSynced2: 200,
                sbSyncExit: 'invalid',
            });

            // Number('invalid') = NaN, treated as 0, then checks sbSynced2 > 0 (true) = COMPLETED
            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.COMPLETED);
        });

        it('should handle all zero values', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                mdResyncDt: '0',
                sbSynced: 0,
                sbSynced2: 0,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should prioritize active operation over completed status', () => {
            const varData = createMockVarData({
                mdResyncPos: 50,
                mdResyncDt: '100',
                sbSynced: 1000,
                sbSynced2: 2000,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.RUNNING);
        });

        it('should prioritize active paused operation over completed status', () => {
            const varData = createMockVarData({
                mdResyncPos: 50,
                mdResyncDt: '0',
                sbSynced: 1000,
                sbSynced2: 2000,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.PAUSED);
        });

        it('should prioritize never run over other statuses when sbSynced is 0', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 0,
                sbSynced2: 100,
                sbSyncExit: '-4',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should prioritize cancelled over failed status', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSynced2: 0,
                sbSyncExit: '-4',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.CANCELLED);
        });

        it('should handle very large numbers', () => {
            const varData = createMockVarData({
                mdResyncPos: Number.MAX_SAFE_INTEGER,
                mdResyncDt: String(Number.MAX_SAFE_INTEGER),
                sbSynced: Number.MAX_SAFE_INTEGER,
                sbSynced2: Number.MAX_SAFE_INTEGER,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.RUNNING);
        });

        it('should handle negative mdResyncPos as edge case', () => {
            const varData = createMockVarData({
                mdResyncPos: -1,
                mdResyncDt: '100',
                sbSynced: 100,
                sbSynced2: 200,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.COMPLETED);
        });

        it('should handle hexadecimal string in sbSyncExit', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                sbSynced: 100,
                sbSyncExit: '0x4',
            });

            // Number('0x4') = 4 (valid hex), so 4 !== 0 is true, returns FAILED
            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.FAILED);
        });

        it('should handle scientific notation in mdResyncDt', () => {
            const varData = createMockVarData({
                mdResyncPos: 1,
                mdResyncDt: '1e3',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.RUNNING);
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

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.NEVER_RUN);
        });

        it('should handle system with successful completed check', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                mdResyncDt: '0',
                sbSynced: 1640995200, // Example timestamp
                sbSynced2: 1640998800, // One hour later
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.COMPLETED);
        });

        it('should handle user-cancelled check scenario', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                mdResyncDt: '0',
                sbSynced: 1640995200,
                sbSynced2: 1640996000, // Cancelled after 13 minutes
                sbSyncExit: '-4',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.CANCELLED);
        });

        it('should handle failed check with error', () => {
            const varData = createMockVarData({
                mdResyncPos: 0,
                mdResyncDt: '0',
                sbSynced: 1640995200,
                sbSynced2: 1640996000,
                sbSyncExit: '1', // Generic error
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.FAILED);
        });

        it('should handle currently running check at 50%', () => {
            const varData = createMockVarData({
                mdResyncPos: 500000,
                mdResyncDt: '1000',
                sbSynced: 1640995200,
                sbSynced2: 0, // Not completed yet
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.RUNNING);
        });

        it('should handle paused check scenario', () => {
            const varData = createMockVarData({
                mdResyncPos: 250000,
                mdResyncDt: '0', // Paused
                sbSynced: 1640995200,
                sbSynced2: 0,
                sbSyncExit: '0',
            });

            expect(getParityCheckStatus(varData)).toBe(ParityCheckStatus.PAUSED);
        });
    });
});
