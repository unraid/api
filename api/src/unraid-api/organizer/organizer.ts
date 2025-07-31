import {
    OrganizerFolder,
    OrganizerResource,
    OrganizerResourceRef,
    OrganizerV1,
    OrganizerView,
} from '@app/unraid-api/organizer/organizer.dto.js';

export function resourceToResourceRef(
    resource: OrganizerResource,
    refId: (resource: OrganizerResource) => string
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
