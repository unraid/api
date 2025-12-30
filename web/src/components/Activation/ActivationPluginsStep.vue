<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery } from '@vue/apollo-composable';

import { BrandButton } from '@unraid/ui';

import { INSTALLED_UNRAID_PLUGINS_QUERY } from '~/components/Activation/graphql/installedPlugins.query';
import usePluginInstaller from '~/components/Activation/usePluginInstaller';
import { PluginInstallStatus } from '~/composables/gql/graphql';

export interface Props {
  onComplete: () => void;
  onSkip?: () => void;
  onBack?: () => void;
  showSkip?: boolean;
  showBack?: boolean;
  isRequired?: boolean;
  isSavingStep?: boolean;
}

const props = defineProps<Props>();
const { t } = useI18n();

interface Plugin {
  id: string;
  name: string;
  description: string;
  url: string;
}

const normalizePluginFileName = (value: string) => value.trim().toLowerCase();

const getPluginFileName = (url: string) => {
  const parts = url.split('/');
  return parts[parts.length - 1] ?? url;
};

const availablePlugins: Plugin[] = [
  {
    id: 'community-apps',
    name: 'Community Apps',
    description: 'Browse and install plugins and Docker containers',
    url: 'https://raw.githubusercontent.com/unraid/community.applications/master/plugins/community.applications.plg',
  },
  {
    id: 'fix-common-problems',
    name: 'Fix Common Problems',
    description: 'Automatically detect and fix common configuration issues',
    url: 'https://raw.githubusercontent.com/unraid/fix.common.problems/master/plugins/fix.common.problems.plg',
  },
  {
    id: 'tailscale',
    name: 'Tailscale',
    description: 'Secure remote access with Tailscale VPN',
    url: 'https://raw.githubusercontent.com/unraid/unraid-tailscale/main/plugin/tailscale.plg',
  },
];

type PluginStatus = 'pending' | 'installing' | 'success' | 'error';

type PluginState = {
  status: PluginStatus;
  logs: string[];
};

const pluginStates = reactive<Record<string, PluginState>>(
  Object.fromEntries(
    availablePlugins.map((plugin) => [
      plugin.id,
      {
        status: 'pending',
        logs: [],
      },
    ])
  )
);

const selectedPlugins = ref<Set<string>>(new Set());
const installedPluginIds = ref<Set<string>>(new Set());
const isInstalling = ref(false);
const error = ref<string | null>(null);
const installationFinished = ref(false);

const { result: installedPluginsResult } = useQuery(INSTALLED_UNRAID_PLUGINS_QUERY, null, {
  fetchPolicy: 'network-only',
});

const { installPlugin } = usePluginInstaller();

const INSTALL_TIMEOUT_MS = 60000;

const installablePlugins = computed(() =>
  availablePlugins.filter(
    (plugin) => selectedPlugins.value.has(plugin.id) && !installedPluginIds.value.has(plugin.id)
  )
);

const hasInstallableSelection = computed(() => installablePlugins.value.length > 0);

const isPluginInstalled = (pluginId: string) => installedPluginIds.value.has(pluginId);
const isBusy = computed(() => isInstalling.value || (props.isSavingStep ?? false));

const applyInstalledPlugins = (installedPlugins: string[] | null | undefined) => {
  if (!Array.isArray(installedPlugins)) {
    return;
  }

  const installedFiles = new Set(installedPlugins.map((name) => normalizePluginFileName(name)));
  const nextInstalledIds = new Set<string>();

  for (const plugin of availablePlugins) {
    const fileName = normalizePluginFileName(getPluginFileName(plugin.url));
    if (installedFiles.has(fileName)) {
      nextInstalledIds.add(plugin.id);
    }
  }

  installedPluginIds.value = nextInstalledIds;

  if (nextInstalledIds.size > 0) {
    const nextSelected = new Set(selectedPlugins.value);
    for (const id of nextInstalledIds) {
      nextSelected.add(id);
    }
    selectedPlugins.value = nextSelected;
  }

  for (const id of nextInstalledIds) {
    const state = pluginStates[id];
    if (state && state.status !== 'installing') {
      state.status = 'success';
    }
  }
};

watch(
  () => installedPluginsResult.value?.installedUnraidPlugins,
  (installedPlugins) => {
    applyInstalledPlugins(installedPlugins);
  },
  { immediate: true }
);

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Plugin installation timed out.'));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

const combinedLogs = computed(() => {
  return availablePlugins.flatMap((plugin) =>
    pluginStates[plugin.id].logs.map((line) => `[${plugin.name}] ${line}`)
  );
});

const appendPluginLogs = (pluginId: string, lines: string[] | string) => {
  const state = pluginStates[pluginId];
  if (Array.isArray(lines)) {
    state.logs.push(...lines);
  } else {
    state.logs.push(lines);
  }
};

const resetCompletionState = () => {
  installationFinished.value = false;
};

const togglePlugin = (pluginId: string) => {
  if (installedPluginIds.value.has(pluginId) || isBusy.value) {
    return;
  }

  const next = new Set(selectedPlugins.value);
  if (next.has(pluginId)) {
    next.delete(pluginId);
    pluginStates[pluginId].status = 'pending';
    pluginStates[pluginId].logs = [];
  } else {
    next.add(pluginId);
    if (pluginStates[pluginId].status !== 'pending') {
      pluginStates[pluginId].status = 'pending';
      pluginStates[pluginId].logs = [];
    }
  }
  selectedPlugins.value = next;
  resetCompletionState();
};

const handleInstall = async () => {
  const pluginsToInstall = installablePlugins.value;
  if (pluginsToInstall.length === 0) {
    installationFinished.value = true;
    return;
  }

  isInstalling.value = true;
  error.value = null;
  installationFinished.value = false;
  let hadError = false;

  try {
    for (const plugin of pluginsToInstall) {
      const state = pluginStates[plugin.id];
      state.status = 'installing';
      state.logs = [];
      appendPluginLogs(
        plugin.id,
        t('activation.pluginsStep.installingPluginMessage', { name: plugin.name })
      );

      let result;
      const installPromise = installPlugin({
        url: plugin.url,
        name: plugin.name,
        forced: true,
        onEvent: (event) => {
          if (event.output?.length) {
            appendPluginLogs(plugin.id, event.output);
          }
        },
      });

      installPromise.catch(() => {});

      try {
        result = await withTimeout(installPromise, INSTALL_TIMEOUT_MS);
      } catch (installError) {
        state.status = 'error';
        appendPluginLogs(plugin.id, t('activation.pluginsStep.installFailed'));
        hadError = true;
        continue;
      }

      if (result.status !== PluginInstallStatus.SUCCEEDED) {
        state.status = 'error';
        appendPluginLogs(plugin.id, t('activation.pluginsStep.installFailed'));
        hadError = true;
        continue;
      }

      if (result.output?.length) {
        appendPluginLogs(plugin.id, result.output);
      }
      appendPluginLogs(
        plugin.id,
        t('activation.pluginsStep.pluginInstalledMessage', { name: plugin.name })
      );
      state.status = 'success';
      const nextInstalled = new Set(installedPluginIds.value);
      nextInstalled.add(plugin.id);
      installedPluginIds.value = nextInstalled;
    }

    installationFinished.value = pluginsToInstall.every((plugin) =>
      ['success', 'error'].includes(pluginStates[plugin.id].status)
    );
    if (hadError) {
      error.value = t('activation.pluginsStep.installFailed');
    }
  } catch (err) {
    error.value = t('activation.pluginsStep.installFailed');
    console.error('Failed to install plugins:', err);
    installationFinished.value = false;
  } finally {
    isInstalling.value = false;
  }
};

const handleSkip = () => {
  props.onSkip?.();
};

const handleBack = () => {
  props.onBack?.();
};

const handlePrimaryAction = async () => {
  if (installationFinished.value || !hasInstallableSelection.value) {
    props.onComplete();
    return;
  }

  if (!isBusy.value) {
    await handleInstall();
  }
};

const primaryButtonText = computed(() => {
  if (installationFinished.value) {
    return t('common.continue');
  }
  if (hasInstallableSelection.value) {
    return t('activation.pluginsStep.installSelected');
  }
  return t('common.continue');
});

const isPrimaryActionDisabled = computed(() => {
  if (isBusy.value) {
    return true;
  }

  if (installationFinished.value) {
    return false;
  }

  if (!props.isRequired) {
    return false;
  }

  return selectedPlugins.value.size === 0;
});
</script>

<template>
  <div class="mx-auto flex w-full max-w-2xl flex-col items-center justify-center">
    <h2 class="mb-4 text-xl font-semibold">
      {{ t('activation.pluginsStep.installEssentialPlugins') }}
    </h2>
    <p class="mb-8 text-center text-sm opacity-75">
      {{ t('activation.pluginsStep.selectPluginsDescription') }}
    </p>

    <div class="mb-8 flex w-full flex-col gap-4">
      <label
        v-for="plugin in availablePlugins"
        :key="plugin.id"
        :for="plugin.id"
        class="border-border bg-card hover:bg-accent/50 flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors"
      >
        <div class="mt-1 h-5 w-5">
          <div
            v-if="pluginStates[plugin.id].status === 'installing'"
            class="border-primary h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
          />
          <input
            v-else
            :id="plugin.id"
            type="checkbox"
            :checked="selectedPlugins.has(plugin.id)"
            :disabled="isBusy || isPluginInstalled(plugin.id)"
            @change="() => togglePlugin(plugin.id)"
            class="text-primary focus:ring-primary h-5 w-5 cursor-pointer rounded border-gray-300 focus:ring-2"
          />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <div class="font-semibold">{{ plugin.name }}</div>
            <span
              v-if="pluginStates[plugin.id].status === 'installing'"
              class="text-primary flex items-center gap-1 text-xs"
            >
              <span
                class="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent"
              />
              {{ t('activation.pluginsStep.status.installing') }}
            </span>
            <span
              v-else-if="pluginStates[plugin.id].status === 'success'"
              class="text-xs text-green-600"
            >
              {{ t('activation.pluginsStep.status.success') }}
            </span>
            <span v-else-if="pluginStates[plugin.id].status === 'error'" class="text-xs text-red-500">
              {{ t('activation.pluginsStep.status.error') }}
            </span>
          </div>
          <div class="text-sm opacity-75">{{ plugin.description }}</div>
        </div>
      </label>
    </div>

    <div
      v-if="combinedLogs.length > 0"
      class="border-border bg-muted/40 mb-4 max-h-48 w-full overflow-y-auto rounded border p-3 text-left font-mono text-xs"
    >
      <div v-for="(line, index) in combinedLogs" :key="`${index}-${line}`">
        {{ line }}
      </div>
    </div>

    <div v-if="error" class="mb-4 text-sm text-red-500">
      {{ error }}
    </div>

    <div class="flex gap-4">
      <BrandButton
        v-if="onBack && showBack"
        :text="t('common.back')"
        variant="outline"
        :disabled="isBusy"
        @click="handleBack"
      />
      <div class="flex-1" />
      <BrandButton
        v-if="onSkip && showSkip"
        :text="t('common.skip')"
        variant="outline"
        :disabled="isBusy"
        @click="handleSkip"
      />
      <BrandButton
        :text="primaryButtonText"
        :disabled="isPrimaryActionDisabled"
        :loading="isBusy"
        @click="handlePrimaryAction"
      />
    </div>
  </div>
</template>
