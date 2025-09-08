import type { Resource } from '~/composables/gql/graphql.js';

import { AuthAction } from '~/composables/gql/graphql.js';

export interface PermissionPreset {
  resources: Resource[];
  actions: AuthAction[];
}

/**
 * Permission preset definitions matching the backend form schema
 */
export const PERMISSION_PRESETS: Record<string, PermissionPreset> = {
  docker_manager: {
    resources: ['DOCKER' as Resource],
    actions: [AuthAction.CREATE_ANY, AuthAction.READ_ANY, AuthAction.UPDATE_ANY, AuthAction.DELETE_ANY],
  },
  vm_manager: {
    resources: ['VMS' as Resource],
    actions: [AuthAction.CREATE_ANY, AuthAction.READ_ANY, AuthAction.UPDATE_ANY, AuthAction.DELETE_ANY],
  },
  monitoring: {
    resources: ['INFO', 'DASHBOARD', 'LOGS', 'ARRAY', 'DISK', 'NETWORK'] as Resource[],
    actions: [AuthAction.READ_ANY],
  },
  backup_manager: {
    resources: ['FLASH', 'SHARE'] as Resource[],
    actions: [AuthAction.CREATE_ANY, AuthAction.READ_ANY, AuthAction.UPDATE_ANY, AuthAction.DELETE_ANY],
  },
  network_admin: {
    resources: ['NETWORK', 'SERVICES'] as Resource[],
    actions: [AuthAction.CREATE_ANY, AuthAction.READ_ANY, AuthAction.UPDATE_ANY, AuthAction.DELETE_ANY],
  },
};

/**
 * Composable for working with API key permission presets
 */
export function useApiKeyPermissionPresets() {
  /**
   * Get a specific preset by ID
   */
  const getPreset = (presetId: string): PermissionPreset | undefined => {
    return PERMISSION_PRESETS[presetId];
  };

  /**
   * Apply a preset to custom permissions array
   */
  const applyPreset = (
    presetId: string,
    existingPermissions: Array<{ resources: Resource[]; actions: AuthAction[] }> = []
  ): Array<{ resources: Resource[]; actions: AuthAction[] }> => {
    const preset = getPreset(presetId);
    if (!preset) return existingPermissions;

    return [
      ...existingPermissions,
      {
        resources: preset.resources,
        actions: preset.actions,
      },
    ];
  };

  /**
   * Get all available preset IDs
   */
  const getPresetIds = (): string[] => {
    return Object.keys(PERMISSION_PRESETS);
  };

  /**
   * Get a human-readable label for a preset
   */
  const getPresetLabel = (presetId: string): string => {
    const labels: Record<string, string> = {
      docker_manager: 'Docker Manager',
      vm_manager: 'VM Manager',
      monitoring: 'Monitoring (Read Only)',
      backup_manager: 'Backup Manager',
      network_admin: 'Network Administrator',
    };
    return labels[presetId] || presetId;
  };

  return {
    getPreset,
    applyPreset,
    getPresetIds,
    getPresetLabel,
    PERMISSION_PRESETS,
  };
}
