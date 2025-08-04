import { afterEach, describe, expect, it, vi } from 'vitest';

import * as viewValidation from '@app/unraid-api/organizer/organizer-view.validation.js';
import {
    OrganizerFolder,
    OrganizerResourceRef,
    OrganizerV1,
    OrganizerView,
} from '@app/unraid-api/organizer/organizer.model.js';
import {
    getRefsFromViewEntries,
    validateOrganizerIntegrity,
    validateViewIntegrity,
    validateViewResourceRefs,
} from '@app/unraid-api/organizer/organizer.validation.js';

// Test data factories for better maintainability
const createRef = (id: string, target: string): OrganizerResourceRef => ({
    id,
    type: 'ref' as const,
    target,
});

const createFolder = (id: string, name: string, children: string[]): OrganizerFolder => ({
    id,
    type: 'folder' as const,
    name,
    children,
});

const createView = (
    partial: Partial<OrganizerView> & Pick<OrganizerView, 'root' | 'entries'>
): OrganizerView => ({
    id: 'view1',
    name: 'Test View',
    ...partial,
});

describe('organizer.validation', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });
    describe('getRefsFromViewEntries', () => {
        it('should return empty set for empty entries', () => {
            const entries = {};
            const refs = getRefsFromViewEntries(entries);
            expect(refs.size).toBe(0);
        });

        it('should collect refs from top-level ref entries', () => {
            const entries = {
                ref1: { id: 'ref1', type: 'ref' as const, target: 'resource1' },
                ref2: { id: 'ref2', type: 'ref' as const, target: 'resource2' },
            };
            const refs = getRefsFromViewEntries(entries);
            expect(refs.size).toBe(2);
            expect(refs.has('resource1')).toBe(true);
            expect(refs.has('resource2')).toBe(true);
        });

        it('should collect refs from nested folder structure', () => {
            const entries = {
                folder1: {
                    id: 'folder1',
                    type: 'folder' as const,
                    name: 'Folder 1',
                    children: ['ref1', 'folder2'],
                },
                folder2: {
                    id: 'folder2',
                    type: 'folder' as const,
                    name: 'Folder 2',
                    children: ['ref2', 'ref3'],
                },
                ref1: { id: 'ref1', type: 'ref' as const, target: 'resource1' },
                ref2: { id: 'ref2', type: 'ref' as const, target: 'resource2' },
                ref3: { id: 'ref3', type: 'ref' as const, target: 'resource3' },
            };
            const refs = getRefsFromViewEntries(entries);
            expect(refs.size).toBe(3);
            expect(refs.has('resource1')).toBe(true);
            expect(refs.has('resource2')).toBe(true);
            expect(refs.has('resource3')).toBe(true);
        });

        it('should handle missing/orphaned child entries', () => {
            const entries = {
                folder1: {
                    id: 'folder1',
                    type: 'folder' as const,
                    name: 'Folder 1',
                    children: ['ref1', 'missing-child'],
                },
                ref1: { id: 'ref1', type: 'ref' as const, target: 'resource1' },
            };
            const refs = getRefsFromViewEntries(entries);
            expect(refs.size).toBe(1);
            expect(refs.has('resource1')).toBe(true);
        });

        it('should prevent infinite loops with circular references', () => {
            const entries = {
                folder1: {
                    id: 'folder1',
                    type: 'folder' as const,
                    name: 'Folder 1',
                    children: ['folder2'],
                },
                folder2: {
                    id: 'folder2',
                    type: 'folder' as const,
                    name: 'Folder 2',
                    children: ['folder1', 'ref1'],
                },
                ref1: { id: 'ref1', type: 'ref' as const, target: 'resource1' },
            };
            const refs = getRefsFromViewEntries(entries);
            expect(refs.size).toBe(1);
            expect(refs.has('resource1')).toBe(true);
        });

        it('should handle folders with non-array children gracefully', () => {
            const entries = {
                folder1: {
                    id: 'folder1',
                    type: 'folder' as const,
                    name: 'Folder 1',
                    children: 'not-an-array' as any,
                },
                ref1: { id: 'ref1', type: 'ref' as const, target: 'resource1' },
            };
            const refs = getRefsFromViewEntries(entries);
            expect(refs.size).toBe(1);
            expect(refs.has('resource1')).toBe(true);
        });

        it('should handle duplicate refs correctly', () => {
            const entries = {
                ref1: { id: 'ref1', type: 'ref' as const, target: 'resource1' },
                ref2: { id: 'ref2', type: 'ref' as const, target: 'resource1' },
            };
            const refs = getRefsFromViewEntries(entries);
            expect(refs.size).toBe(1);
            expect(refs.has('resource1')).toBe(true);
        });

        it('should handle self-referencing folders', () => {
            const entries = {
                folder1: createFolder('folder1', 'Self Ref', ['folder1', 'ref1']),
                ref1: createRef('ref1', 'resource1'),
            };
            const refs = getRefsFromViewEntries(entries);
            expect(refs.size).toBe(1);
            expect(refs.has('resource1')).toBe(true);
        });

        it('should handle deeply nested structures', () => {
            // Create a deeply nested structure
            const entries: any = {};
            let currentId = 'folder0';
            for (let i = 0; i < 100; i++) {
                const nextId = `folder${i + 1}`;
                entries[currentId] = createFolder(currentId, `Folder ${i}`, [nextId]);
                currentId = nextId;
            }
            entries[currentId] = createFolder(currentId, 'Last Folder', ['ref1']);
            entries.ref1 = createRef('ref1', 'resource1');

            const refs = getRefsFromViewEntries(entries);
            expect(refs.size).toBe(1);
            expect(refs.has('resource1')).toBe(true);
        });

        it('should handle entries with null or undefined values', () => {
            const entries: any = {
                folder1: createFolder('folder1', 'Folder', ['ref1', 'null-entry']),
                ref1: createRef('ref1', 'resource1'),
                'null-entry': null,
                'undefined-entry': undefined,
            };
            const refs = getRefsFromViewEntries(entries);
            expect(refs.size).toBe(1);
            expect(refs.has('resource1')).toBe(true);
        });
    });

    describe('validateViewResourceRefs', () => {
        it('should return true when all refs exist in resources', () => {
            const view: OrganizerView = {
                id: 'view1',
                name: 'Test View',
                root: 'folder1',
                entries: {
                    folder1: {
                        id: 'folder1',
                        type: 'folder',
                        name: 'Folder 1',
                        children: ['ref1', 'ref2'],
                    },
                    ref1: { id: 'ref1', type: 'ref', target: 'resource1' },
                    ref2: { id: 'ref2', type: 'ref', target: 'resource2' },
                },
            };
            const resources = new Set(['resource1', 'resource2', 'resource3']);
            expect(validateViewResourceRefs(view, resources)).toBe(true);
        });

        it('should return false when some refs do not exist in resources', () => {
            const view: OrganizerView = {
                id: 'view1',
                name: 'Test View',
                root: 'ref1',
                entries: {
                    ref1: { id: 'ref1', type: 'ref', target: 'resource1' },
                    ref2: { id: 'ref2', type: 'ref', target: 'missing-resource' },
                },
            };
            const resources = new Set(['resource1']);
            expect(validateViewResourceRefs(view, resources)).toBe(false);
        });

        it('should return true for empty view entries', () => {
            const view: OrganizerView = {
                id: 'view1',
                name: 'Test View',
                root: 'root',
                entries: {},
            };
            const resources = new Set(['resource1']);
            expect(validateViewResourceRefs(view, resources)).toBe(true);
        });

        it('should return true when resources is empty but view has no refs', () => {
            const view: OrganizerView = {
                id: 'view1',
                name: 'Test View',
                root: 'folder1',
                entries: {
                    folder1: {
                        id: 'folder1',
                        type: 'folder',
                        name: 'Folder 1',
                        children: [],
                    },
                },
            };
            const resources = new Set<string>();
            expect(validateViewResourceRefs(view, resources)).toBe(true);
        });
    });

    describe('validateViewIntegrity', () => {
        it('should validate a valid view successfully without mocks', () => {
            const view = createView({
                root: 'folder1',
                entries: {
                    folder1: createFolder('folder1', 'Folder 1', ['ref1']),
                    ref1: createRef('ref1', 'resource1'),
                },
            });
            const resources = new Set(['resource1']);

            const result = validateViewIntegrity({ view, resources });
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual({});
        });

        it('should validate a valid view successfully with mocked structure validation', async () => {
            const view: OrganizerView = {
                id: 'view1',
                name: 'Test View',
                root: 'folder1',
                entries: {
                    folder1: {
                        id: 'folder1',
                        type: 'folder',
                        name: 'Folder 1',
                        children: ['ref1'],
                    },
                    ref1: { id: 'ref1', type: 'ref', target: 'resource1' },
                },
            };
            const resources = new Set(['resource1']);

            vi.spyOn(viewValidation, 'validateViewStructure').mockReturnValue({
                isValid: true,
                errors: {},
            });

            const result = validateViewIntegrity({ view, resources });
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual({});
        });

        it('should fail fast on structure validation failure', async () => {
            const view: OrganizerView = {
                id: 'view1',
                name: 'Test View',
                root: 'missing-root',
                entries: {},
            };
            const resources = new Set(['resource1']);

            vi.spyOn(viewValidation, 'validateViewStructure').mockReturnValue({
                isValid: false,
                errors: { rootMissing: false },
            } as any);

            const result = validateViewIntegrity({ view, resources });
            expect(result.isValid).toBe(false);
            expect(result.errors.structureValidation).toEqual({
                isValid: false,
                errors: { rootMissing: false },
            });
            expect(result.errors.allRefsPresent).toBeUndefined();
        });

        it('should validate view with complex structure without mocks', () => {
            const view = createView({
                root: 'folder1',
                entries: {
                    folder1: createFolder('folder1', 'Root', ['folder2', 'ref1']),
                    folder2: createFolder('folder2', 'Sub', ['ref2', 'ref3']),
                    ref1: createRef('ref1', 'resource1'),
                    ref2: createRef('ref2', 'resource2'),
                    ref3: createRef('ref3', 'missing-resource'),
                },
            });
            const resources = new Set(['resource1', 'resource2']);

            const result = validateViewIntegrity({ view, resources });
            expect(result.isValid).toBe(false);
            expect(result.errors.allRefsPresent).toBe(false);
        });

        it('should report missing resource refs', async () => {
            const view: OrganizerView = {
                id: 'view1',
                name: 'Test View',
                root: 'ref1',
                entries: {
                    ref1: { id: 'ref1', type: 'ref', target: 'missing-resource' },
                },
            };
            const resources = new Set<string>();

            vi.spyOn(viewValidation, 'validateViewStructure').mockReturnValue({
                isValid: true,
                errors: {},
            });

            const result = validateViewIntegrity({ view, resources });
            expect(result.isValid).toBe(false);
            expect(result.errors.allRefsPresent).toBe(false);
        });
    });

    describe('validateOrganizerIntegrity', () => {
        it('should validate a valid organizer', async () => {
            const organizer: OrganizerV1 = {
                version: 1,
                resources: {
                    resource1: { id: 'resource1', type: 'container', name: 'Container 1' },
                    resource2: { id: 'resource2', type: 'vm', name: 'VM 1' },
                },
                views: {
                    view1: {
                        id: 'view1',
                        name: 'Test View',
                        root: 'folder1',
                        entries: {
                            folder1: {
                                id: 'folder1',
                                type: 'folder',
                                name: 'Folder 1',
                                children: ['ref1'],
                            },
                            ref1: { id: 'ref1', type: 'ref', target: 'resource1' },
                        },
                    },
                },
            };

            vi.spyOn(viewValidation, 'validateViewStructure').mockReturnValue({
                isValid: true,
                errors: {},
            });

            const result = await validateOrganizerIntegrity(organizer);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveProperty('view1');
        });

        it('should validate multiple views independently', async () => {
            const organizer: OrganizerV1 = {
                version: 1,
                resources: {
                    resource1: { id: 'resource1', type: 'container', name: 'Container 1' },
                },
                views: {
                    view1: {
                        id: 'view1',
                        name: 'Valid View',
                        root: 'ref1',
                        entries: {
                            ref1: { id: 'ref1', type: 'ref', target: 'resource1' },
                        },
                    },
                    view2: {
                        id: 'view2',
                        name: 'Invalid View',
                        root: 'ref2',
                        entries: {
                            ref2: { id: 'ref2', type: 'ref', target: 'missing-resource' },
                        },
                    },
                },
            };

            vi.spyOn(viewValidation, 'validateViewStructure').mockReturnValue({
                isValid: true,
                errors: {},
            });

            const result = await validateOrganizerIntegrity(organizer);
            expect(result.isValid).toBe(false);

            // The errors object has view names as keys and ValidationResult objects as values
            // Check that both views were processed
            expect(result.errors).toHaveProperty('view1');
            expect(result.errors).toHaveProperty('view2');

            // Verify validation results
            const view1Result = result.errors.view1 as any;
            const view2Result = result.errors.view2 as any;
            expect(view1Result.isValid).toBe(true);
            expect(view2Result.isValid).toBe(false);
            expect(view2Result.errors.allRefsPresent).toBe(false);
        });

        it('should handle empty views', async () => {
            const organizer: OrganizerV1 = {
                version: 1,
                resources: {
                    resource1: { id: 'resource1', type: 'container', name: 'Container 1' },
                },
                views: {},
            };

            const result = await validateOrganizerIntegrity(organizer);
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual({});
        });

        it('should handle validation errors gracefully', async () => {
            const organizer: OrganizerV1 = {
                version: 1,
                resources: {},
                views: {
                    view1: {
                        id: 'view1',
                        name: 'Test View',
                        root: 'ref1',
                        entries: {
                            ref1: { id: 'ref1', type: 'ref', target: 'resource1' },
                        },
                    },
                },
            };

            vi.spyOn(viewValidation, 'validateViewStructure').mockImplementation(() => {
                throw new Error('Validation error');
            });

            const result = await validateOrganizerIntegrity(organizer);
            expect(result.isValid).toBe(false);
            expect(result.errors).toBeDefined();
        });

        it('should process all views even if some fail', async () => {
            const organizer: OrganizerV1 = {
                version: 1,
                resources: {
                    resource1: { id: 'resource1', type: 'container', name: 'Container 1' },
                },
                views: {
                    view1: {
                        id: 'view1',
                        name: 'View 1',
                        root: 'ref1',
                        entries: {
                            ref1: { id: 'ref1', type: 'ref', target: 'resource1' },
                        },
                    },
                    view2: {
                        id: 'view2',
                        name: 'View 2',
                        root: 'ref2',
                        entries: {
                            ref2: { id: 'ref2', type: 'ref', target: 'resource1' },
                        },
                    },
                    view3: {
                        id: 'view3',
                        name: 'View 3',
                        root: 'ref3',
                        entries: {
                            ref3: { id: 'ref3', type: 'ref', target: 'missing' },
                        },
                    },
                },
            };

            let callCount = 0;
            vi.spyOn(viewValidation, 'validateViewStructure').mockImplementation(() => {
                callCount++;
                if (callCount === 2) {
                    throw new Error('Validation error');
                }
                return { isValid: true, errors: {} } as any;
            });

            const result = await validateOrganizerIntegrity(organizer);
            expect(result.isValid).toBe(false);
            // Should have processed view1 and view3, but not view2 due to error
            const processedViews = Object.keys(result.errors);
            expect(processedViews.length).toBe(2);
            expect(processedViews).toContain('view1');
            expect(processedViews).toContain('view3');
        });

        it('should handle organizer with no resources', async () => {
            const organizer: OrganizerV1 = {
                version: 1,
                resources: {},
                views: {
                    view1: createView({
                        root: 'folder1',
                        entries: {
                            folder1: createFolder('folder1', 'Empty Folder', []),
                        },
                    }),
                },
            };

            const result = await validateOrganizerIntegrity(organizer);
            expect(result.isValid).toBe(true);
        });

        it('should validate organizer without mocks for integration test', async () => {
            const organizer: OrganizerV1 = {
                version: 1,
                resources: {
                    resource1: { id: 'resource1', type: 'container', name: 'Container 1' },
                },
                views: {
                    validView: createView({
                        id: 'validView',
                        root: 'ref1',
                        entries: {
                            ref1: createRef('ref1', 'resource1'),
                        },
                    }),
                    invalidView: createView({
                        id: 'invalidView',
                        root: 'missing-root',
                        entries: {},
                    }),
                },
            };

            const result = await validateOrganizerIntegrity(organizer);
            expect(result.isValid).toBe(false);

            const validViewResult = result.errors.validView as any;
            const invalidViewResult = result.errors.invalidView as any;

            expect(validViewResult.isValid).toBe(true);
            expect(invalidViewResult.isValid).toBe(false);
        });

        it('should test class-validator transformation integration', async () => {
            // This test reproduces the actual issue with validateObject
            const plainConfig = {
                version: 1,
                resources: {
                    resource1: { id: 'resource1', type: 'container', name: 'Container 1' },
                },
                views: {
                    default: {
                        id: 'default',
                        name: 'Default',
                        root: 'root',
                        entries: {
                            root: { type: 'folder', id: 'root', name: 'Root', children: ['ref1'] },
                            ref1: { id: 'ref1', type: 'ref', target: 'resource1' },
                        },
                    },
                },
            };

            // Import the validateObject function to test the actual transformation
            const { validateObject } = await import(
                '@app/unraid-api/graph/resolvers/validation.utils.js'
            );

            const validated = await validateObject(OrganizerV1, plainConfig);

            // Verify the validation creates a proper class instance
            expect(validated).toBeInstanceOf(OrganizerV1);
            // Compare data content by serializing both objects (ignores prototype differences)
            expect(JSON.parse(JSON.stringify(validated))).toEqual(plainConfig);
        });
    });
});
