import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveFileInDirectory } from '@app/core/utils/files/resolve-file-in-directory.js';

describe('resolveFileInDirectory', () => {
    it.each([
        '',
        '.',
        '..',
        '../outside',
        '../keys-other/file',
        '/outside',
        'nested/file',
        'nested/../file',
        '..\\outside',
        'C:\\outside',
        'server:file',
        'bad\0file',
    ])('rejects unsafe filename %j', (filename) => {
        expect(() => resolveFileInDirectory('/keys', filename)).toThrow();
    });

    it.each([
        'normal.notify',
        'key-123.json',
        'Überwachung v1.2 (NAS).notify',
        '..not-traversal',
        '%2e%2e%2ffile',
    ])('preserves a literal safe filename %j', (filename) => {
        expect(resolveFileInDirectory('/keys', filename)).toBe(join('/keys', filename));
    });

    it('resolves relative base directories', () => {
        expect(resolveFileInDirectory('keys', 'key.json')).toBe(resolve('keys/key.json'));
    });
});
