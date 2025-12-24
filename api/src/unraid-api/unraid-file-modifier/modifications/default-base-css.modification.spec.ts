import { Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import DefaultBaseCssModification from '@app/unraid-api/unraid-file-modifier/modifications/default-base-css.modification.js';

// Mock node:fs/promises
vi.mock('node:fs/promises', () => ({
    readFile: vi.fn(),
}));

describe('DefaultBaseCssModification', () => {
    let modification: DefaultBaseCssModification;
    let logger: Logger;

    beforeEach(() => {
        logger = new Logger('test');
        modification = new DefaultBaseCssModification(logger);
    });

    it('should correctly apply :scope to selectors', async () => {
        const inputCss = `
body {
    padding: 0;
}
.Theme--sidebar {
    color: red;
}
.Theme--sidebar #displaybox {
    width: 100%;
}
.Theme--nav-top .LanguageButton {
    font-size: 10px;
}
.Theme--width-boxed #displaybox {
    max-width: 1000px;
}
`;

        // Mock readFile to return our inputCss
        vi.mocked(readFile).mockResolvedValue(inputCss);

        // Access the private method applyToSource by casting to any or using a publicly exposed way.
        // Since generatePatch calls applyToSource, we can interpret 'generatePatch' output,
        // OR we can spy on applyToSource if we want to be tricky,
        // BUT simpler is to inspect the patch string OR expose applyToSource for testing if possible.
        // However, I can't easily change the class just for this without editing it.
        // Let's use 'generatePatch' and see the diff.
        // OR, better yet, since I am adding this test to verify the logic, allow me to access the private method via 'any' cast.

        // @ts-expect-error accessing private method
        const result = modification.applyToSource(inputCss);

        expect(result).toContain(':scope.Theme--sidebar {');
        expect(result).toContain(':scope.Theme--sidebar #displaybox {');
        expect(result).not.toContain(':scope.Theme--nav-top .LanguageButton {');
        expect(result).toContain(':scope.Theme--width-boxed #displaybox {');

        // Ensure @scope wrapper is present
        expect(result).toContain('@scope (:root) to (.unapi) {');
        expect(result).toMatch(/@scope \(:root\) to \(\.unapi\) \{[\s\S]*:scope\.Theme--sidebar \{/);
    });

    it('should not modify other selectors', async () => {
        const inputCss = `
body {
    padding: 0;
}
.OtherClass {
    color: blue;
}
`;
        vi.mocked(readFile).mockResolvedValue(inputCss);

        // @ts-expect-error accessing private method
        const result = modification.applyToSource(inputCss);

        expect(result).toContain('.OtherClass {');
        expect(result).not.toContain(':scope.OtherClass');
    });

    it('should throw if body block end is not found', () => {
        const inputCss = `html { }`;
        // @ts-expect-error accessing private method
        expect(() => modification.applyToSource(inputCss)).toThrow('Could not find end of body block');
    });
});
