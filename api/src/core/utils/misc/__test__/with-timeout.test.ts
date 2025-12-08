import { describe, expect, it } from 'vitest';

import { withTimeout } from '@app/core/utils/misc/with-timeout.js';

describe('withTimeout', () => {
    it('resolves when promise completes before timeout', async () => {
        const promise = Promise.resolve('success');
        const result = await withTimeout(promise, 1000, 'testOp');
        expect(result).toBe('success');
    });

    it('resolves with correct value for delayed promise within timeout', async () => {
        const promise = new Promise<number>((resolve) => setTimeout(() => resolve(42), 50));
        const result = await withTimeout(promise, 1000, 'testOp');
        expect(result).toBe(42);
    });

    it('rejects when promise takes longer than timeout', async () => {
        const promise = new Promise<string>((resolve) => setTimeout(() => resolve('late'), 500));
        await expect(withTimeout(promise, 50, 'slowOp')).rejects.toThrow('slowOp timed out after 50ms');
    });

    it('includes operation name in timeout error message', async () => {
        const promise = new Promise<void>(() => {}); // Never resolves
        await expect(withTimeout(promise, 10, 'myCustomOperation')).rejects.toThrow(
            'myCustomOperation timed out after 10ms'
        );
    });

    it('propagates rejection from the original promise', async () => {
        const promise = Promise.reject(new Error('original error'));
        await expect(withTimeout(promise, 1000, 'testOp')).rejects.toThrow('original error');
    });

    it('resolves immediately for already-resolved promises', async () => {
        const promise = Promise.resolve('immediate');
        const start = Date.now();
        const result = await withTimeout(promise, 1000, 'testOp');
        const elapsed = Date.now() - start;

        expect(result).toBe('immediate');
        expect(elapsed).toBeLessThan(50); // Should be nearly instant
    });

    it('works with zero timeout (immediately times out for pending promises)', async () => {
        const promise = new Promise<void>(() => {}); // Never resolves
        await expect(withTimeout(promise, 0, 'zeroTimeout')).rejects.toThrow(
            'zeroTimeout timed out after 0ms'
        );
    });

    it('preserves the type of the resolved value', async () => {
        interface TestType {
            id: number;
            name: string;
        }
        const testObj: TestType = { id: 1, name: 'test' };
        const promise = Promise.resolve(testObj);

        const result = await withTimeout(promise, 1000, 'testOp');

        expect(result.id).toBe(1);
        expect(result.name).toBe('test');
    });
});
