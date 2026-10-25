import { buildSchema, parse, validate } from 'graphql';
import { describe, expect, it } from 'vitest';

import { requestProtection } from '@app/unraid-api/graph/request-protection.js';

const schema = buildSchema('type Query { value: String, child: Query }');

const validateRequest = (query: string) =>
    validate(schema, parse(query), requestProtection.validationRules);

describe('requestProtection', () => {
    it('allows normal queries and requests at the alias limit', () => {
        expect(validateRequest('{ value }')).toHaveLength(0);

        const aliases = Array.from({ length: 100 }, (_, index) => `a${index}: value`).join(' ');
        expect(validateRequest(`{ ${aliases} }`)).toHaveLength(0);
    });

    it('rejects requests that exceed the alias limit', () => {
        const aliases = Array.from({ length: 101 }, (_, index) => `a${index}: value`).join(' ');
        expect(validateRequest(`{ ${aliases} }`).length).toBeGreaterThan(0);
    });

    it('rejects excessive fields without aliases', () => {
        const fields = Array.from({ length: 1_001 }, () => 'value').join(' ');
        expect(validateRequest(`{ ${fields} }`).length).toBeGreaterThan(0);
    });

    it('counts repeated fragment spreads', () => {
        const spreads = Array.from({ length: 1_001 }, () => '...Values').join(' ');
        expect(
            validateRequest(`{ ${spreads} } fragment Values on Query { value }`).length
        ).toBeGreaterThan(0);
    });

    it('counts aliases and fields inside nested fragments', () => {
        const spreads = Array.from({ length: 101 }, () => '...Outer').join(' ');
        expect(
            validateRequest(
                `{ ${spreads} } fragment Outer on Query { ...Inner } fragment Inner on Query { alias: value }`
            ).length
        ).toBeGreaterThan(0);
    });

    it('rejects deeply nested fields', () => {
        const nested = `${'child { '.repeat(20)}value${' }'.repeat(20)}`;
        expect(validateRequest(`{ ${nested} }`).length).toBeGreaterThan(0);
    });

    it('does not count named fragments as field depth', () => {
        const fragments = Array.from(
            { length: 21 },
            (_, index) =>
                `fragment F${index} on Query { ${index === 20 ? 'value' : `...F${index + 1}`} }`
        ).join(' ');
        expect(validateRequest(`{ ...F0 } ${fragments}`)).toHaveLength(0);
    });

    it('checks each operation separately', () => {
        expect(validateRequest('query First { value } query Second { value }')).toHaveLength(0);
    });
});
