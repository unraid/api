import { useMutation } from '@vue/apollo-composable';
import { useDebounceFn, useStorage } from '@vueuse/core';

import { UPDATE_DOCKER_VIEW_PREFERENCES } from '@/components/Docker/docker-update-view-prefs.mutation';

interface ViewPreferences {
  columnVisibility?: Record<string, boolean>;
}

export function useDockerViewPreferences(viewId = 'default') {
  const storageKey = `docker-view-prefs-${viewId}`;

  const localPrefs = useStorage<ViewPreferences>(storageKey, {});

  const { mutate: updatePrefs } = useMutation(UPDATE_DOCKER_VIEW_PREFERENCES);

  const saveToServer = useDebounceFn((prefs: ViewPreferences) => {
    updatePrefs({
      viewId,
      prefs,
    });
  }, 1000);

  function loadColumnVisibility(): Record<string, boolean> | undefined {
    return localPrefs.value.columnVisibility;
  }

  function mergeServerPreferences(serverPrefs?: Record<string, unknown> | null) {
    if (!serverPrefs) return;

    const merged: ViewPreferences = {};

    if (serverPrefs.columnVisibility) {
      merged.columnVisibility = serverPrefs.columnVisibility as Record<string, boolean>;
    }

    if (Object.keys(merged).length > 0) {
      localPrefs.value = { ...localPrefs.value, ...merged };
    }
  }

  function saveColumnVisibility(columnVisibility: Record<string, boolean>) {
    localPrefs.value = {
      ...localPrefs.value,
      columnVisibility,
    };

    saveToServer(localPrefs.value);
  }

  return {
    loadColumnVisibility,
    mergeServerPreferences,
    saveColumnVisibility,
  };
}
