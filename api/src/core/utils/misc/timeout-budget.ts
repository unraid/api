/**
 * Tracks remaining time budget to ensure we don't exceed external timeouts (e.g., PM2's listen_timeout).
 *
 * This class helps coordinate multiple async operations by:
 * - Tracking elapsed time from construction
 * - Calculating dynamic timeouts based on remaining budget
 * - Reserving time for critical operations (like server bootstrap)
 *
 * @example
 * ```typescript
 * const budget = new TimeoutBudget(15000); // 15 second total budget
 *
 * // Each operation gets a timeout capped by remaining budget
 * await withTimeout(loadConfig(), budget.getTimeout(2000, 8000), 'loadConfig');
 * await withTimeout(loadState(), budget.getTimeout(2000, 8000), 'loadState');
 *
 * // Bootstrap gets all remaining time
 * await withTimeout(bootstrap(), budget.remaining(), 'bootstrap');
 *
 * console.log(`Completed in ${budget.elapsed()}ms`);
 * ```
 */
export class TimeoutBudget {
    private startTime: number;
    private budgetMs: number;

    /**
     * Creates a new startup budget tracker.
     * @param budgetMs Total time budget in milliseconds
     */
    constructor(budgetMs: number) {
        this.startTime = Date.now();
        this.budgetMs = budgetMs;
    }

    /**
     * Returns remaining time in milliseconds.
     * Never returns negative values.
     */
    remaining(): number {
        return Math.max(0, this.budgetMs - (Date.now() - this.startTime));
    }

    /**
     * Returns elapsed time in milliseconds since construction.
     */
    elapsed(): number {
        return Date.now() - this.startTime;
    }

    /**
     * Returns timeout for an operation, capped by remaining budget.
     *
     * @param maxMs Maximum timeout for this operation
     * @param reserveMs Time to reserve for future operations (e.g., server bootstrap)
     * @returns Timeout in milliseconds (minimum 100ms to avoid instant failures)
     */
    getTimeout(maxMs: number, reserveMs: number = 0): number {
        const available = this.remaining() - reserveMs;
        return Math.max(100, Math.min(maxMs, available));
    }

    /**
     * Checks if there's enough time remaining for an operation.
     * @param requiredMs Time required in milliseconds
     */
    hasTimeFor(requiredMs: number): boolean {
        return this.remaining() >= requiredMs;
    }
}
