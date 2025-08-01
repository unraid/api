import {
    AnyOrganizerResource,
    OrganizerFolder,
    OrganizerResource,
    OrganizerResourceRef,
    OrganizerV1,
    OrganizerView,
    ResolvedOrganizerEntryType,
    ResolvedOrganizerFolder,
    ResolvedOrganizerV1,
    ResolvedOrganizerView,
} from '@app/unraid-api/organizer/organizer.dto.js';

export function resourceToResourceRef(
    resource: AnyOrganizerResource,
    refId: (resource: AnyOrganizerResource) => string
): OrganizerResourceRef {
    return {
        id: refId(resource) ?? resource.id,
        type: 'ref',
        target: resource.id,
    };
}

/**
 * Adds any missing resources to an organizer view by creating resource references
 * and placing them in the root folder.
 *
 * This function ensures that all resources from the provided resources collection
 * are represented in the view. Any resources that don't already exist in the view
 * will be added as resource references and placed in the root folder's children.
 *
 * @param resources - A collection of organizer resources keyed by their ID
 * @param originalView - The original organizer view to augment with missing resources
 * @returns A new organizer view containing all original entries plus any missing resources
 *
 * @example
 * ```typescript
 * const resources = { 'res1': { id: 'res1', name: 'Resource 1' } };
 * const view = { root: 'folder1', name: 'My View', entries: {} };
 * const updatedView = addMissingResourcesToView(resources, view);
 * // updatedView will contain 'res1' as a resource reference in the root folder
 * ```
 */
export function addMissingResourcesToView(
    resources: OrganizerV1['resources'],
    originalView: OrganizerView
): OrganizerView {
    const view = structuredClone(originalView);
    view.entries[view.root] ??= {
        id: view.root,
        name: view.name,
        type: 'folder',
        children: [],
    };
    const root = view.entries[view.root]! as OrganizerFolder;
    const rootChildren = new Set(root.children);

    Object.entries(resources).forEach(([id, resource]) => {
        if (!view.entries[id]) {
            view.entries[id] = resourceToResourceRef(resource, (resource) => resource.id);
            rootChildren.add(id);
        }
    });
    root.children = Array.from(rootChildren);
    return view;
}

/**
 * Recursively resolves an organizer entry (folder or resource ref) into its actual objects.
 * This transforms the flat ID-based structure into a nested object structure for frontend convenience.
 *
 * PRECONDITION: The given view is valid (ie. does not contain any cycles or depth issues).
 *
 * @param entryId - The ID of the entry to resolve
 * @param view - The organizer view containing the entry definitions
 * @param resources - The collection of all available resources
 * @returns The resolved entry with actual objects instead of ID references
 */
function resolveEntry(
    entryId: string,
    view: OrganizerView,
    resources: OrganizerV1['resources']
): ResolvedOrganizerEntryType {
    const entry = view.entries[entryId];

    if (!entry) {
        throw new Error(`Entry with id '${entryId}' not found in view`);
    }

    if (entry.type === 'folder') {
        // Recursively resolve all children
        const resolvedChildren = entry.children.map((childId) => resolveEntry(childId, view, resources));

        return {
            id: entry.id,
            type: 'folder',
            name: entry.name,
            children: resolvedChildren,
        } as ResolvedOrganizerFolder;
    } else if (entry.type === 'ref') {
        // Resolve the resource reference
        const resource = resources[entry.target];
        if (!resource) {
            throw new Error(`Resource with id '${entry.target}' not found`);
        }
        return resource;
    }

    throw new Error(`Unknown entry type: ${(entry as any).type}`);
}

/**
 * Transforms a flat organizer view into a resolved view where all ID references
 * are replaced with actual objects.
 *
 * PRECONDITION: The given view is valid (ie. does not contain any cycles or depth issues).
 *
 * @param view - The flat organizer view to resolve
 * @param resources - The collection of all available resources
 * @returns A resolved view with nested objects instead of ID references
 */
export function resolveOrganizerView(
    view: OrganizerView,
    resources: OrganizerV1['resources']
): ResolvedOrganizerView {
    const resolvedRoot = resolveEntry(view.root, view, resources);

    return {
        id: view.id,
        name: view.name,
        root: resolvedRoot,
        prefs: view.prefs,
    };
}

/**
 * Transforms a flat organizer structure into a resolved structure where all ID references
 * are replaced with actual objects for frontend convenience.
 *
 * @param organizer - The flat organizer structure to resolve
 * @returns A resolved organizer with nested objects instead of ID references
 */
export function resolveOrganizer(organizer: OrganizerV1): ResolvedOrganizerV1 {
    const resolvedViews: ResolvedOrganizerView[] = [];

    for (const [viewId, view] of Object.entries(organizer.views)) {
        resolvedViews.push(resolveOrganizerView(view, organizer.resources));
    }

    return {
        version: 1,
        views: resolvedViews,
    };
}
