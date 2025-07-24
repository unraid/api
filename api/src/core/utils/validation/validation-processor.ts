/**
 * @fileoverview Type-safe sequential validation processor
 *
 * This module provides a flexible validation system that allows you to chain multiple
 * validation steps together in a type-safe manner. It supports both fail-fast and
 * continue-on-error modes, with comprehensive error collection and reporting.
 *
 * Key features:
 * - Type-safe validation pipeline creation
 * - Sequential validation step execution
 * - Configurable fail-fast behavior (global or per-step)
 * - Comprehensive error collection with typed results
 * - Helper functions for common validation result interpretations
 *
 * @example
 * ```typescript
 * const validator = createValidationProcessor({
 *   steps: [
 *     {
 *       name: 'required',
 *       validator: (input: string) => input.length > 0,
 *       isError: ResultInterpreters.booleanMeansSuccess
 *     },
 *     {
 *       name: 'email',
 *       validator: (input: string) => /\S+@\S+\.\S+/.test(input),
 *       isError: ResultInterpreters.booleanMeansSuccess
 *     }
 *   ]
 * });
 *
 * const result = validator('user@example.com');
 * if (!result.isValid) {
 *   console.log('Validation errors:', result.errors);
 * }
 * ```
 */

export type ValidationStepConfig<TInput, TResult, TName extends string = string> = {
    name: TName;
    validator: (input: TInput) => TResult;
    isError: (result: TResult) => boolean;
    alwaysFailFast?: boolean;
};

export interface ValidationPipelineConfig {
    failFast?: boolean;
}

export type ValidationPipelineDefinition<
    TInput,
    TSteps extends readonly ValidationStepConfig<TInput, any, string>[],
> = {
    steps: TSteps;
};

export type ExtractStepResults<TSteps extends readonly ValidationStepConfig<any, any, string>[]> = {
    [K in TSteps[number]['name']]: Extract<TSteps[number], { name: K }> extends ValidationStepConfig<
        any,
        infer R,
        K
    >
        ? R
        : never;
};

export type ValidationResult<TSteps extends readonly ValidationStepConfig<any, any, string>[]> = {
    isValid: boolean;
    errors: Partial<ExtractStepResults<TSteps>>;
};

// Extract TInput from the first step's validator function
type ExtractInputType<TSteps extends readonly ValidationStepConfig<any, any, string>[]> =
    TSteps[number] extends ValidationStepConfig<infer TInput, any, string> ? TInput : never;

/**
 * Creates a type-safe validation processor that executes a series of validation steps
 * sequentially and collects errors from failed validations.
 *
 * This function returns a validation processor that can be called with input data
 * and an optional configuration object. The processor will run each validation step
 * in order, collecting any errors that occur.
 *
 * @template TSteps - A readonly array of validation step configurations that defines
 *                   the validation pipeline. The type is constrained to ensure type safety
 *                   across all steps and their results.
 *
 * @param definition - The validation pipeline definition
 * @param definition.steps - An array of validation step configurations. Each step must have:
 *   - `name`: A unique string identifier for the step
 *   - `validator`: A function that takes input and returns a validation result
 *   - `isError`: A function that determines if the validation result represents an error
 *   - `alwaysFailFast`: Optional flag to always stop execution on this step's failure
 *
 * @returns A validation processor function that accepts:
 *   - `input`: The data to validate (type inferred from the first validation step)
 *   - `config`: Optional configuration object with:
 *     - `failFast`: If true, stops execution on first error (unless overridden by step config)
 *
 * @example Basic usage with string validation
 * ```typescript
 * const nameValidator = createValidationProcessor({
 *   steps: [
 *     {
 *       name: 'required',
 *       validator: (input: string) => input.trim().length > 0,
 *       isError: ResultInterpreters.booleanMeansSuccess
 *     },
 *     {
 *       name: 'minLength',
 *       validator: (input: string) => input.length >= 2,
 *       isError: ResultInterpreters.booleanMeansSuccess
 *     },
 *     {
 *       name: 'maxLength',
 *       validator: (input: string) => input.length <= 50,
 *       isError: ResultInterpreters.booleanMeansSuccess
 *     }
 *   ]
 * });
 *
 * const result = nameValidator('John');
 * // result.isValid: boolean
 * // result.errors: { required?: boolean, minLength?: boolean, maxLength?: boolean }
 * ```
 *
 * @example Complex validation with custom error types
 * ```typescript
 * type ValidationError = { message: string; code: string };
 *
 * const userValidator = createValidationProcessor({
 *   steps: [
 *     {
 *       name: 'email',
 *       validator: (user: { email: string }) =>
 *         /\S+@\S+\.\S+/.test(user.email)
 *           ? null
 *           : { message: 'Invalid email format', code: 'INVALID_EMAIL' },
 *       isError: (result): result is ValidationError => result !== null
 *     },
 *     {
 *       name: 'age',
 *       validator: (user: { age: number }) =>
 *         user.age >= 18
 *           ? null
 *           : { message: 'Must be 18 or older', code: 'UNDERAGE' },
 *       isError: (result): result is ValidationError => result !== null,
 *       alwaysFailFast: true // Stop immediately if age validation fails
 *     }
 *   ]
 * });
 * ```
 *
 * @example Using fail-fast mode
 * ```typescript
 * const result = validator(input, { failFast: true });
 * // Stops on first error, even if subsequent steps would also fail
 * ```
 *
 * @since 1.0.0
 */
export function createValidationProcessor<
    const TSteps extends readonly ValidationStepConfig<any, any, string>[],
>(definition: { steps: TSteps }) {
    type TInput = ExtractInputType<TSteps>;

    return function processValidation(
        input: TInput,
        config: ValidationPipelineConfig = {}
    ): ValidationResult<TSteps> {
        const errors: Partial<ExtractStepResults<TSteps>> = {};
        let hasErrors = false;

        for (const step of definition.steps) {
            const result = step.validator(input);
            const isError = step.isError(result);

            if (isError) {
                hasErrors = true;
                (errors as any)[step.name] = result;

                // Always fail fast for steps marked as such, or when global failFast is enabled
                if (step.alwaysFailFast || config.failFast) {
                    break;
                }
            }
        }

        return {
            isValid: !hasErrors,
            errors,
        };
    };
}

/** Helper functions for common result interpretations */
export const ResultInterpreters = {
    /** For boolean results: true = success, false = error */
    booleanMeansSuccess: (result: boolean): boolean => !result,

    /** For boolean results: false = success, true = error */
    booleanMeansFailure: (result: boolean): boolean => result,

    /** For nullable results: null/undefined = success, anything else = error */
    nullableIsSuccess: <T>(result: T | null | undefined): boolean => result != null,

    /** For array results: empty = success, non-empty = error */
    errorList: <T>(result: T[]): boolean => result.length > 0,

    /** For custom predicate */
    custom: <T>(predicate: (result: T) => boolean) => predicate,

    /** Interpreting the result of a validation processor */
    validationProcessor: (result: { isValid: boolean }) => !result.isValid,
} as const;
