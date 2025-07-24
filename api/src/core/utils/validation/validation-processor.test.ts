import { describe, expect, it } from 'vitest';

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
});
