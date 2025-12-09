import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TimeoutBudget } from '@app/core/utils/misc/timeout-budget.js';

describe('TimeoutBudget', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('constructor', () => {
        it('initializes with the given budget', () => {
            const budget = new TimeoutBudget(10000);
            expect(budget.remaining()).toBe(10000);
            expect(budget.elapsed()).toBe(0);
        });
    });

    describe('remaining', () => {
        it('returns full budget immediately after construction', () => {
            const budget = new TimeoutBudget(5000);
            expect(budget.remaining()).toBe(5000);
        });

        it('decreases as time passes', () => {
            const budget = new TimeoutBudget(5000);

            vi.advanceTimersByTime(1000);
            expect(budget.remaining()).toBe(4000);

            vi.advanceTimersByTime(2000);
            expect(budget.remaining()).toBe(2000);
        });

        it('never returns negative values', () => {
            const budget = new TimeoutBudget(1000);

            vi.advanceTimersByTime(5000); // Well past the budget
            expect(budget.remaining()).toBe(0);
        });

        it('returns zero when budget is exactly exhausted', () => {
            const budget = new TimeoutBudget(1000);

            vi.advanceTimersByTime(1000);
            expect(budget.remaining()).toBe(0);
        });
    });

    describe('elapsed', () => {
        it('returns zero immediately after construction', () => {
            const budget = new TimeoutBudget(5000);
            expect(budget.elapsed()).toBe(0);
        });

        it('increases as time passes', () => {
            const budget = new TimeoutBudget(5000);

            vi.advanceTimersByTime(1000);
            expect(budget.elapsed()).toBe(1000);

            vi.advanceTimersByTime(500);
            expect(budget.elapsed()).toBe(1500);
        });

        it('continues increasing past the budget limit', () => {
            const budget = new TimeoutBudget(1000);

            vi.advanceTimersByTime(2000);
            expect(budget.elapsed()).toBe(2000);
        });
    });

    describe('getTimeout', () => {
        it('returns maxMs when plenty of budget remains', () => {
            const budget = new TimeoutBudget(10000);
            expect(budget.getTimeout(2000)).toBe(2000);
        });

        it('returns maxMs when budget minus reserve is sufficient', () => {
            const budget = new TimeoutBudget(10000);
            expect(budget.getTimeout(2000, 5000)).toBe(2000);
        });

        it('caps timeout to available budget minus reserve', () => {
            const budget = new TimeoutBudget(10000);
            vi.advanceTimersByTime(5000); // 5000ms remaining

            // Want 2000ms but reserve 4000ms, only 1000ms available
            expect(budget.getTimeout(2000, 4000)).toBe(1000);
        });

        it('caps timeout to remaining budget when no reserve', () => {
            const budget = new TimeoutBudget(1000);
            vi.advanceTimersByTime(800); // 200ms remaining

            expect(budget.getTimeout(500)).toBe(200);
        });

        it('returns minimum of 100ms even when budget is exhausted', () => {
            const budget = new TimeoutBudget(1000);
            vi.advanceTimersByTime(2000); // Budget exhausted

            expect(budget.getTimeout(500)).toBe(100);
        });

        it('returns minimum of 100ms when reserve exceeds remaining', () => {
            const budget = new TimeoutBudget(5000);
            vi.advanceTimersByTime(4000); // 1000ms remaining

            // Reserve 2000ms but only 1000ms remaining
            expect(budget.getTimeout(500, 2000)).toBe(100);
        });

        it('uses default reserve of 0 when not specified', () => {
            const budget = new TimeoutBudget(1000);
            vi.advanceTimersByTime(500); // 500ms remaining

            expect(budget.getTimeout(1000)).toBe(500); // Capped to remaining
        });
    });

    describe('hasTimeFor', () => {
        it('returns true when enough time remains', () => {
            const budget = new TimeoutBudget(5000);
            expect(budget.hasTimeFor(3000)).toBe(true);
        });

        it('returns true when exactly enough time remains', () => {
            const budget = new TimeoutBudget(5000);
            expect(budget.hasTimeFor(5000)).toBe(true);
        });

        it('returns false when not enough time remains', () => {
            const budget = new TimeoutBudget(5000);
            expect(budget.hasTimeFor(6000)).toBe(false);
        });

        it('accounts for elapsed time', () => {
            const budget = new TimeoutBudget(5000);
            vi.advanceTimersByTime(3000); // 2000ms remaining

            expect(budget.hasTimeFor(2000)).toBe(true);
            expect(budget.hasTimeFor(3000)).toBe(false);
        });

        it('returns false when budget is exhausted', () => {
            const budget = new TimeoutBudget(1000);
            vi.advanceTimersByTime(2000);

            expect(budget.hasTimeFor(1)).toBe(false);
        });

        it('returns true for zero required time', () => {
            const budget = new TimeoutBudget(1000);
            vi.advanceTimersByTime(2000); // Budget exhausted

            expect(budget.hasTimeFor(0)).toBe(true);
        });
    });

    describe('integration scenarios', () => {
        it('simulates a typical startup sequence', () => {
            const budget = new TimeoutBudget(13000); // 13 second budget
            const BOOTSTRAP_RESERVE = 8000;
            const MAX_OP_TIMEOUT = 2000;

            // First operation - should get full 2000ms
            const op1Timeout = budget.getTimeout(MAX_OP_TIMEOUT, BOOTSTRAP_RESERVE);
            expect(op1Timeout).toBe(2000);

            // Simulate operation taking 500ms
            vi.advanceTimersByTime(500);

            // Second operation - still have plenty of budget
            const op2Timeout = budget.getTimeout(MAX_OP_TIMEOUT, BOOTSTRAP_RESERVE);
            expect(op2Timeout).toBe(2000);

            // Simulate operation taking 1000ms
            vi.advanceTimersByTime(1000);

            // Third operation
            const op3Timeout = budget.getTimeout(MAX_OP_TIMEOUT, BOOTSTRAP_RESERVE);
            expect(op3Timeout).toBe(2000);

            // Simulate slow operation taking 2000ms
            vi.advanceTimersByTime(2000);

            // Now 3500ms elapsed, 9500ms remaining
            // After reserve, only 1500ms available - less than max
            const op4Timeout = budget.getTimeout(MAX_OP_TIMEOUT, BOOTSTRAP_RESERVE);
            expect(op4Timeout).toBe(1500);

            // Simulate operation completing
            vi.advanceTimersByTime(1000);

            // Bootstrap phase - use all remaining time
            const bootstrapTimeout = budget.remaining();
            expect(bootstrapTimeout).toBe(8500);
            expect(budget.hasTimeFor(8000)).toBe(true);
        });

        it('handles worst-case scenario where all operations timeout', () => {
            const budget = new TimeoutBudget(13000);
            const BOOTSTRAP_RESERVE = 8000;
            const MAX_OP_TIMEOUT = 2000;

            // Each operation times out at its limit
            // Available for operations: 13000 - 8000 = 5000ms

            // Op 1: gets 2000ms, times out
            budget.getTimeout(MAX_OP_TIMEOUT, BOOTSTRAP_RESERVE);
            vi.advanceTimersByTime(2000);

            // Op 2: gets 2000ms, times out
            budget.getTimeout(MAX_OP_TIMEOUT, BOOTSTRAP_RESERVE);
            vi.advanceTimersByTime(2000);

            // Op 3: only 1000ms available (5000 - 4000), times out
            const op3Timeout = budget.getTimeout(MAX_OP_TIMEOUT, BOOTSTRAP_RESERVE);
            expect(op3Timeout).toBe(1000);
            vi.advanceTimersByTime(1000);

            // Bootstrap: should still have 8000ms
            expect(budget.remaining()).toBe(8000);
        });
    });
});
