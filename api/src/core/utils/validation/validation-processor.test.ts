import { describe, expect, it } from 'vitest';

import type { ValidationResult } from '@app/core/utils/validation/validation-processor.js';
import {
    createValidationProcessor,
    ResultInterpreters,
} from '@app/core/utils/validation/validation-processor.js';

describe('ValidationProcessor', () => {
    type TestInput = { value: number; text: string };

    it('should process all validation steps when no errors occur', () => {
        const steps = [
            {
                name: 'positiveValue',
                validator: (input: TestInput) => input.value > 0,
                isError: ResultInterpreters.booleanMeansSuccess,
            },
            {
                name: 'nonEmptyText',
                validator: (input: TestInput) => input.text.length > 0,
                isError: ResultInterpreters.booleanMeansSuccess,
            },
        ] as const;

        const processor = createValidationProcessor({
            steps,
        });

        const result = processor({ value: 5, text: 'hello' }, { failFast: false });

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
    });

    it('should collect all errors when failFast is disabled', () => {
        const steps = [
            {
                name: 'positiveValue',
                validator: (input: TestInput) => input.value > 0,
                isError: ResultInterpreters.booleanMeansSuccess,
            },
            {
                name: 'nonEmptyText',
                validator: (input: TestInput) => input.text.length > 0,
                isError: ResultInterpreters.booleanMeansSuccess,
            },
        ] as const;

        const processor = createValidationProcessor({
            steps,
        });

        const result = processor({ value: -1, text: '' }, { failFast: false });

        expect(result.isValid).toBe(false);
        expect(result.errors.positiveValue).toBe(false);
        expect(result.errors.nonEmptyText).toBe(false);
    });

    it('should stop at first error when failFast is enabled', () => {
        const steps = [
            {
                name: 'positiveValue',
                validator: (input: TestInput) => input.value > 0,
                isError: ResultInterpreters.booleanMeansSuccess,
            },
            {
                name: 'nonEmptyText',
                validator: (input: TestInput) => input.text.length > 0,
                isError: ResultInterpreters.booleanMeansSuccess,
            },
        ] as const;

        const processor = createValidationProcessor({
            steps,
        });

        const result = processor({ value: -1, text: '' }, { failFast: true });

        expect(result.isValid).toBe(false);
        expect(result.errors.positiveValue).toBe(false);
        expect(result.errors.nonEmptyText).toBeUndefined();
    });

    it('should always fail fast on steps marked with alwaysFailFast', () => {
        const steps = [
            {
                name: 'criticalCheck',
                validator: (input: TestInput) => input.value !== 0,
                isError: ResultInterpreters.booleanMeansSuccess,
                alwaysFailFast: true,
            },
            {
                name: 'nonEmptyText',
                validator: (input: TestInput) => input.text.length > 0,
                isError: ResultInterpreters.booleanMeansSuccess,
            },
        ] as const;

        const processor = createValidationProcessor({
            steps,
        });

        const result = processor({ value: 0, text: '' }, { failFast: false });

        expect(result.isValid).toBe(false);
        expect(result.errors.criticalCheck).toBe(false);
        expect(result.errors.nonEmptyText).toBeUndefined(); // Should not be executed
    });

    it('should work with different result interpreters', () => {
        const steps = [
            {
                name: 'arrayResult',
                validator: (input: TestInput) => [1, 2, 3],
                isError: ResultInterpreters.errorList,
            },
            {
                name: 'nullableResult',
                validator: (input: TestInput) => (input.value > 0 ? null : 'error'),
                isError: ResultInterpreters.nullableIsSuccess,
            },
        ] as const;

        const processor = createValidationProcessor({
            steps,
        });

        const result = processor({ value: -1, text: 'test' }, { failFast: false });

        expect(result.isValid).toBe(false);
        expect(result.errors.arrayResult).toEqual([1, 2, 3]);
        expect(result.errors.nullableResult).toBe('error');
    });

    it('should handle 0-arity validators', () => {
        const processor = createValidationProcessor({
            steps: [
                {
                    name: 'zeroArityValidator',
                    validator: () => true,
                    isError: ResultInterpreters.booleanMeansSuccess,
                },
                {
                    name: 'zeroArityValidator2',
                    validator: () => false,
                    isError: ResultInterpreters.booleanMeansFailure,
                },
            ] as const,
        });

        const result = processor(null);
        expect(result.isValid).toBe(true);
    });

    it('should work with custom result interpreter', () => {
        const steps = [
            {
                name: 'customCheck',
                validator: (input: TestInput) => ({ isOk: input.value > 0, code: 'VALUE_CHECK' }),
                isError: ResultInterpreters.custom((result: { isOk: boolean }) => !result.isOk),
            },
        ] as const;

        const processor = createValidationProcessor({ steps });

        const validResult = processor({ value: 5, text: 'test' });
        expect(validResult.isValid).toBe(true);
        expect(validResult.errors).toEqual({});

        const invalidResult = processor({ value: -1, text: 'test' });
        expect(invalidResult.isValid).toBe(false);
        expect(invalidResult.errors.customCheck).toEqual({ isOk: false, code: 'VALUE_CHECK' });
    });

    it('should work with validationProcessor result interpreter', () => {
        const innerProcessor = createValidationProcessor({
            steps: [
                {
                    name: 'innerCheck',
                    validator: (val: number) => val > 0,
                    isError: ResultInterpreters.booleanMeansSuccess,
                },
            ] as const,
        });

        const outerProcessor = createValidationProcessor({
            steps: [
                {
                    name: 'nestedValidation',
                    validator: (input: TestInput) => innerProcessor(input.value),
                    isError: ResultInterpreters.validationProcessor,
                },
            ] as const,
        });

        const validResult = outerProcessor({ value: 5, text: 'test' });
        expect(validResult.isValid).toBe(true);

        const invalidResult = outerProcessor({ value: -1, text: 'test' });
        expect(invalidResult.isValid).toBe(false);
        expect(invalidResult.errors.nestedValidation).toMatchObject({ isValid: false });
    });

    it('should handle empty steps array', () => {
        const processor = createValidationProcessor<readonly []>({
            steps: [],
        });

        const result = processor('any input' as never);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
    });

    it('should throw when validators throw errors', () => {
        const steps = [
            {
                name: 'throwingValidator',
                validator: (input: TestInput) => {
                    if (input.value === 0) {
                        throw new Error('Division by zero');
                    }
                    return true;
                },
                isError: ResultInterpreters.booleanMeansSuccess,
            },
        ] as const;

        const processor = createValidationProcessor({ steps });

        expect(() => processor({ value: 0, text: 'test' })).toThrow('Division by zero');
    });

    describe('complex validation scenarios', () => {
        it('should handle multi-type validation results', () => {
            type ComplexInput = {
                email: string;
                age: number;
                tags: string[];
            };

            const steps = [
                {
                    name: 'emailFormat',
                    validator: (input: ComplexInput) =>
                        /\S+@\S+\.\S+/.test(input.email) ? null : 'Invalid email format',
                    isError: ResultInterpreters.nullableIsSuccess,
                },
                {
                    name: 'ageRange',
                    validator: (input: ComplexInput) => input.age >= 18 && input.age <= 120,
                    isError: ResultInterpreters.booleanMeansSuccess,
                },
                {
                    name: 'tagValidation',
                    validator: (input: ComplexInput) => {
                        const invalidTags = input.tags.filter((tag) => tag.length < 2);
                        return invalidTags;
                    },
                    isError: ResultInterpreters.errorList,
                },
            ] as const;

            const processor = createValidationProcessor({ steps });

            const validInput: ComplexInput = {
                email: 'user@example.com',
                age: 25,
                tags: ['valid', 'tags', 'here'],
            };
            const validResult = processor(validInput);
            expect(validResult.isValid).toBe(true);

            const invalidInput: ComplexInput = {
                email: 'invalid-email',
                age: 150,
                tags: ['ok', 'a', 'b', 'valid'],
            };
            const invalidResult = processor(invalidInput, { failFast: false });
            expect(invalidResult.isValid).toBe(false);
            expect(invalidResult.errors.emailFormat).toBe('Invalid email format');
            expect(invalidResult.errors.ageRange).toBe(false);
            expect(invalidResult.errors.tagValidation).toEqual(['a', 'b']);
        });

        it('should preserve type safety with heterogeneous result types', () => {
            const steps = [
                {
                    name: 'stringResult',
                    validator: () => 'error message',
                    isError: (result: string) => result.length > 0,
                },
                {
                    name: 'numberResult',
                    validator: () => 42,
                    isError: (result: number) => result !== 0,
                },
                {
                    name: 'objectResult',
                    validator: () => ({ code: 'ERR_001', severity: 'high' }),
                    isError: (result: { code: string; severity: string }) => true,
                },
            ] as const;

            const processor = createValidationProcessor({ steps });
            const result = processor(null, { failFast: false });

            expect(result.isValid).toBe(false);
            expect(result.errors.stringResult).toBe('error message');
            expect(result.errors.numberResult).toBe(42);
            expect(result.errors.objectResult).toEqual({ code: 'ERR_001', severity: 'high' });
        });
    });

    describe('edge cases', () => {
        it('should handle undefined vs null in nullable interpreter', () => {
            const steps = [
                {
                    name: 'nullCheck',
                    validator: () => null,
                    isError: ResultInterpreters.nullableIsSuccess,
                },
                {
                    name: 'undefinedCheck',
                    validator: () => undefined,
                    isError: ResultInterpreters.nullableIsSuccess,
                },
                {
                    name: 'zeroCheck',
                    validator: () => 0,
                    isError: ResultInterpreters.nullableIsSuccess,
                },
                {
                    name: 'falseCheck',
                    validator: () => false,
                    isError: ResultInterpreters.nullableIsSuccess,
                },
            ] as const;

            const processor = createValidationProcessor({ steps });
            const result = processor(null, { failFast: false });

            expect(result.isValid).toBe(false);
            expect(result.errors.nullCheck).toBeUndefined();
            expect(result.errors.undefinedCheck).toBeUndefined();
            expect(result.errors.zeroCheck).toBe(0);
            expect(result.errors.falseCheck).toBe(false);
        });

        it('should handle very long validation chains', () => {
            // Test the real-world scenario of dynamically generated validation steps
            // Note: This demonstrates a limitation of the current type system -
            // dynamic step generation loses strict typing but still works at runtime
            type StepInput = { value: number };

            const steps = Array.from({ length: 50 }, (_, i) => ({
                name: `step${i}`,
                validator: (input: StepInput) => input.value > i,
                isError: ResultInterpreters.booleanMeansSuccess,
            }));

            // For dynamic steps, we need to use a type assertion since TypeScript
            // can't infer the literal string union from Array.from()
            const processor = createValidationProcessor({
                steps,
            });

            const result = processor({ value: 25 }, { failFast: false });
            expect(result.isValid).toBe(false);

            const errorCount = Object.keys(result.errors).length;
            expect(errorCount).toBe(25);
        });
    });
});
