import {
    createValidationProcessor,
    ResultInterpreters,
} from '@app/core/utils/validation/validation-processor.js';
import { validateViewStructure } from '@app/unraid-api/organizer/organizer-view.validation.js';
import {
    OrganizerResource,
    OrganizerV1,
    OrganizerView,
} from '@app/unraid-api/organizer/organizer.dto.js';
import { batchProcess } from '@app/utils.js';

/**
 * Finds all refs from a view, including those nested in folders.
 * Returns a set of target resource IDs that the refs point to.
 */
export function getRefsFromViewEntries(entries: OrganizerView['entries']): Set<string> {
    const refs: Set<string> = new Set();
    const visited: Set<string> = new Set();

    function collectRefs(entryId: string): void {
        if (visited.has(entryId)) return; // prevent infinite loops
        visited.add(entryId);

        const entry = entries[entryId];
        if (!entry) return; // orphaned/missing node

        if (entry.type === 'ref') {
            refs.add(entry.target);
        } else if (entry.type === 'folder' && Array.isArray(entry.children)) {
            for (const childId of entry.children) {
                collectRefs(childId);
            }
        }
    }

    Object.keys(entries).forEach((entryId) => {
        collectRefs(entryId);
    });
    return refs;
}

/**
 * Checks if all resources referenced by the view are present in the resources set.
 *
 * @param view - The view to check.
 * @param resources - The set of resources to check against.
 * @returns True if all resources referenced by the view are present in the resources set, false otherwise.
 */
export function validateViewResourceRefs(view: OrganizerView, resources: Set<string>): boolean {
    const refs = getRefsFromViewEntries(view.entries);
    return resources.isSupersetOf(refs);
}

type ViewAndResources = {
    view: OrganizerView;
    resources: Set<string>;
};

/**
 * Validates the structural and referential integrity of a view.
 *
 * @param view - The view to check.
 * @param resources - The set of resources for the view.
 * @returns True if the view is valid, false otherwise.
 */
export const validateViewIntegrity = createValidationProcessor({
    steps: [
        {
            name: 'structureValidation',
            validator: ({ view }: ViewAndResources) => validateViewStructure(view),
            isError: ResultInterpreters.validationProcessor,
            alwaysFailFast: true,
        },
        {
            name: 'allRefsPresent',
            isError: ResultInterpreters.booleanMeansSuccess,
            validator: ({ view, resources }: ViewAndResources) =>
                validateViewResourceRefs(view, resources),
        },
    ] as const,
});

/**
 * Validates the structural and referential integrity of an organizer.
 *
 * @param organizer - The organizer to check.
 * @returns True if the organizer is valid, false otherwise.
 */
export async function validateOrganizerIntegrity(organizer: OrganizerV1) {
    const resources = new Set(Object.keys(organizer.resources));
    const views = Object.entries(organizer.views);
    const validateView = async (view: OrganizerView) => validateViewIntegrity({ view, resources });

    const { errorOccurred, data } = await batchProcess(views, async ([viewName, view]) => {
        return [viewName, await validateView(view)] as const;
    });
    return {
        isValid: !errorOccurred && data.every(([, result]) => result.isValid),
        errors: Object.fromEntries(data),
    };
}
