import 'reflect-metadata';

import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

/**
 * Validates an object against a class using class-validator
 * Automatically exposes all fields for transformation
 *
 * @param type The class to validate against
 * @param object The object to validate
 * @returns The validated and transformed object
 * @throws ValidationError if validation fails
 */
export async function validateObject<T extends object>(type: new () => T, object: unknown): Promise<T> {
    const instance = plainToClass(type, object, {
        enableImplicitConversion: true,
    });

    const errors = await validate(instance, {
        whitelist: true,
        validationError: { target: false, value: true },
    });

    if (errors.length > 0) {
        const singleError = new ValidationError();
        singleError.target = instance;
        singleError.value = object;
        singleError.children = errors;
        throw singleError;
    }

    return instance;
}
