import 'reflect-metadata';

import { plainToClass } from 'class-transformer';
import {
    registerDecorator,
    validate,
    ValidationArguments,
    ValidationError,
    ValidationOptions,
} from 'class-validator';

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

/**
 * Custom validator to ensure at least one of the given properties is a non-empty array
 */
export function AtLeastOneOf(properties: string[], validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'atLeastOneOf',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(_: any, args: ValidationArguments) {
                    const obj = args.object as any;
                    return properties.some((prop) => Array.isArray(obj[prop]) && obj[prop].length > 0);
                },
                defaultMessage(args: ValidationArguments) {
                    return `At least one of the following must be a non-empty array: ${properties.join(', ')}`;
                },
            },
        });
    };
}
