import { expect, test, describe } from "bun:test";

import { namespaceObject, denamespaceObject, denamespaceAll } from '../namespace.js';

describe('namespace-utils', () => {
  describe('namespaceObject', () => {
    test('should prefix all keys with namespace', () => {
      const input = {
        sandbox: true,
        debug: false,
        nested: {
          value: 123
        }
      };
      const expected = {
        'api.sandbox': true,
        'api.debug': false,
        'api.nested': {
          value: 123
        }
      };
      expect(namespaceObject(input, 'api')).toEqual(expected);
    });

    test('should handle empty objects', () => {
      expect(namespaceObject({}, 'api')).toEqual({});
    });

    test('should handle null/undefined values', () => {
      const input = {
        a: null,
        b: undefined,
        c: 0
      };
      const expected = {
        'api.a': null,
        'api.b': undefined,
        'api.c': 0
      };
      expect(namespaceObject(input, 'api')).toEqual(expected);
    });

    test('should handle arrays', () => {
      const input = {
        items: [1, 2, 3],
        nested: {
          arr: ['a', 'b']
        }
      };
      const expected = {
        'api.items': [1, 2, 3],
        'api.nested': {
          arr: ['a', 'b']
        }
      };
      expect(namespaceObject(input, 'api')).toEqual(expected);
    });
  });

  describe('denamespaceObject', () => {
    test('should remove namespace prefix from keys', () => {
      const input = {
        'api.sandbox': true,
        'api.debug': false,
        'api.nested': {
          value: 123
        }
      };
      const expected = {
        sandbox: true,
        debug: false,
        nested: {
          value: 123
        }
      };
      expect(denamespaceObject(input, 'api')).toEqual(expected);
    });

    test('should handle empty objects', () => {
      expect(denamespaceObject({}, 'api')).toEqual({});
    });

    test('should handle null/undefined values', () => {
      const input = {
        'api.a': null,
        'api.b': undefined,
        'api.c': 0
      };
      const expected = {
        a: null,
        b: undefined,
        c: 0
      };
      expect(denamespaceObject(input, 'api')).toEqual(expected);
    });

    test('should handle arrays', () => {
      const input = {
        'api.items': [1, 2, 3],
        'api.nested': {
          arr: ['a', 'b']
        }
      };
      const expected = {
        items: [1, 2, 3],
        nested: {
          arr: ['a', 'b']
        }
      };
      expect(denamespaceObject(input, 'api')).toEqual(expected);
    });

    test('should ignore keys without matching namespace', () => {
      const input = {
        'api.sandbox': true,
        'other.key': 'value'
      };
      const expected = {
        sandbox: true
      };
      expect(denamespaceObject(input, 'api')).toEqual(expected);
    });
  });

  describe('denamespaceAll', () => {
    test('should group keys by namespace', () => {
      const input = {
        'api.sandbox': true,
        'api.debug': false,
        'user.name': 'Alice',
        version: '1.0',
      } as const;
      const expected = {
        api: { sandbox: true, debug: false },
        user: { name: 'Alice' },
        version: '1.0',
      } as const;
      expect(denamespaceAll(input)).toEqual(expected);
    });

    test('should respect whitelist', () => {
      const input = {
        'api.sandbox': true,
        'user.name': 'Alice',
      } as const;
      const expected = {
        api: { sandbox: true },
        'user.name': 'Alice',
      } as const;
      expect(denamespaceAll(input, { namespaces: ['api'] })).toEqual(expected);
    });

    test('should leave un-namespaced keys untouched', () => {
      const input = {
        foo: 42,
        'api.bar': 1,
      };
      const expected = {
        api: { bar: 1 },
        foo: 42,
      };
      expect(denamespaceAll(input)).toEqual(expected);
    });

    test('should strip unmatched keys when flag set', () => {
      const input = {
        'api.a': 1,
        'user.b': 2,
        c: 3,
      };
      const expected = {
        api: { a: 1 },
      };
      expect(denamespaceAll(input, { namespaces: ['api'], stripUnmatched: true })).toEqual(
        expected,
      );
    });
  });
}); 