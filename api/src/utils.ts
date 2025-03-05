import { BadRequestException, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { access, constants, copyFile, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';

import strftime from 'strftime';

import { UserAccount } from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';
import { FastifyRequest } from '@app/types/fastify.js';

export function notNull<T>(value: T): value is NonNullable<T> {
    return value !== null;
}

/**
 * Checks if a PromiseSettledResult is fulfilled.
 *
 * @param result A PromiseSettledResult.
 * @returns true if the result is fulfilled, false otherwise.
 */
export function isFulfilled<T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> {
    return result.status === 'fulfilled';
}

/**
 * Checks if a PromiseSettledResult is rejected.
 *
 * @param result A PromiseSettledResult.
 * @returns true if the result is rejected, false otherwise.
 */
export function isRejected<T>(result: PromiseSettledResult<T>): result is PromiseRejectedResult {
    return result.status === 'rejected';
}

/**
 * @returns the number of seconds since Unix Epoch
 */
export const secondsSinceUnixEpoch = (): number => Math.floor(Date.now() / 1_000);

/**
 * Helper to interop with Unraid, which communicates timestamps
 * in seconds since Unix Epoch.
 *
 * @returns the number of seconds since Unix Epoch
 */
export const unraidTimestamp = secondsSinceUnixEpoch;

/**
 * Wrapper for Promise-handling of batch operations based on
 * a list of items.
 *
 * @param items a list of items to process
 * @param action an async function operating on an item from the list
 * @returns
 *   - data: return values from each successful action
 *   - errors: list of errors (Promise Failure Reasons)
 *   - successes: # of successful actions
 *   - errorOccured: true if at least one error occurred
 */
export async function batchProcess<Input, T>(items: Input[], action: (id: Input) => Promise<T>) {
    const processes = items.map(action);

    const results = await Promise.allSettled(processes);
    const successes = results.filter(isFulfilled).map((result) => result.value);
    const errors = results.filter(isRejected).map((result) => result.reason);

    return {
        data: successes,
        successes: successes.length,
        errors: errors,
        errorOccured: errors.length > 0,
    };
}

type IterationOptions = {
    maxIterations?: number;
};

/**
 * Traverses an object and its nested objects, passing each one to a callback function.
 *
 * This function iterates over the input object, using a stack to keep track of nested objects,
 * and applies the given modifier function to each object it encounters.
 * It prevents infinite loops by limiting the number of iterations.
 *
 * @param obj - The object to be traversed and modified.
 * @param modifier - A callback function, taking an object. Modifications should happen in place.
 */
export function updateObject(
    obj: object,
    modifier: (currentObj: object) => void,
    opts: IterationOptions = {}
) {
    const stack = [obj];
    let iterations = 0;
    const { maxIterations = 100 } = opts;
    // Prevent infinite loops
    while (stack.length > 0 && iterations < maxIterations) {
        const current = stack.pop();

        if (current && typeof current === 'object') {
            modifier(current);

            for (const value of Object.values(current)) {
                if (value && typeof value === 'object') {
                    stack.push(value);
                }
            }
        }

        iterations++;
    }
}

/**
 * Formats a date and time according to specified `strftime` format strings.
 *
 * This function takes a Date object and formats it using strftime patterns.
 * It handles special cases for system time format `%c` by optionally removing timezone info.
 * For non-system time formats, it appends the time to the formatted date.
 *
 * @param date - The Date object to format
 * @param options - Formatting options
 * @param options.dateFormat - strftime format string for the date portion (default: '%c')
 * @param options.timeFormat - strftime format string for the time portion (default: '%I:%M %p')
 * @param options.omitTimezone - Whether to remove timezone from system time format (default: true)
 * @returns A formatted date-time string
 *
 * @example
 * // With system time format
 * formatDatetime(new Date()) // 'Wed 20 Nov 2024 06:39:39 AM'
 *
 * // With custom format
 * formatDatetime(new Date(), {
 *   dateFormat: '%Y-%m-%d',
 *   timeFormat: '%H:%M'
 * }) // '2024-11-20 06:39'
 */

export function formatDatetime(
    date: Date,
    options: Partial<{ dateFormat: string; timeFormat: string; omitTimezone?: boolean }> = {}
): string {
    const { dateFormat = '%c', timeFormat = '%I:%M %p', omitTimezone = true } = options;
    let formatted = strftime(dateFormat, date);
    if (dateFormat === '%c') {
        /**----------------------------------------------
         *                Omit Timezone

         *  We omit the trailing tz `%Z` from systime's format
         *  which expands to '%a %d %b %Y %X %Z' in strftime's
         *  implementation. For reference, sys time looks like
         *  'Wed 20 Nov 2024 06:39:39 AM Pacific Standard Time'
         * 
         *---------------------------------------------**/
        if (omitTimezone) {
            const timezoneFreeFormat = '%a %d %b %Y %I:%M:%S %p';
            formatted = strftime(timezoneFreeFormat, date);
        }
    } else {
        /**----------------------------------------------
         *                Append Time
         *
         *  although system time (%c) includes a timestamp,
         *  other formats exposed by unraid don't, so we
         *  add it to the end.
         *
         *  You can find Unraid's datetime options under
         *  `Settings > Date and Time` and by inspecting either:
         *
         *  the date and time select dropdowns in your browser's devtools, or
         *  the `[display]` section of the dynamix config file
         *  located at /boot/config/plugins/dynamix/dynamix.cfg
         *---------------------------------------------**/
        formatted += ' ' + strftime(timeFormat, date);
    }
    return formatted;
}

/**
 * Retrieves the request object from the execution context.
 *
 * @param ctx - Execution context
 * @returns Request object
 */
export function getRequest(ctx: ExecutionContext) {
    const contextType = ctx.getType<'http' | 'graphql'>();
    let request: (FastifyRequest & { user?: UserAccount }) | null = null;

    if (contextType === 'http') {
        request = ctx.switchToHttp().getRequest();
    } else if (contextType === 'graphql') {
        request = GqlExecutionContext.create(ctx).getContext().req;
    }

    if (!request) {
        throw new BadRequestException(
            `Unsupported execution context type: ${contextType}. Only HTTP and GraphQL contexts are supported.`
        );
    }

    return request;
}

/**
 * Standardized error handler for auth operations that converts any error
 * into an UnauthorizedException with proper logging and redacts API keys.
 *
 * @param logger - Logger instance to use for error logging
 * @param operation - Description of the operation that failed
 * @param error - The caught error
 * @param context - Additional context information (e.g., user ID, API key)
 * @throws UnauthorizedException
 */
export function handleAuthError(
    logger: Logger,
    operation: string,
    error: unknown,
    context?: Record<string, string>
): never {
    // Sanitize context by creating a deep clone
    const sanitizedContext = context ? structuredClone(context) : {};

    if (sanitizedContext) {
        updateObject(sanitizedContext, (obj) => {
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'string' && key.toLowerCase().includes('key')) {
                    (obj as any)[key] = '[REDACTED]';
                }
            }
        });
    }

    const contextStr = Object.keys(sanitizedContext || {}).length
        ? ` ${JSON.stringify(sanitizedContext)}`
        : '';

    logger.error(`${operation} ${contextStr}`, error);

    if (error instanceof UnauthorizedException) {
        throw error;
    }
    // Use generic message for unknown errors to prevent information leakage
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    throw new UnauthorizedException(`${operation}: ${errorMessage}`);
}
