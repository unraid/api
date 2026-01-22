<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery } from '@vue/apollo-composable';

import { ChevronLeftIcon, Squares2X2Icon } from '@heroicons/vue/24/outline';
import { ChevronRightIcon, InformationCircleIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';
import { INSTALLED_UNRAID_PLUGINS_QUERY } from '@/components/Activation/graphql/installedPlugins.query';
import usePluginInstaller from '@/components/Activation/usePluginInstaller';
import { PluginInstallStatus } from '@/composables/gql/graphql';
import { Switch } from '@headlessui/vue';

export interface Props {
  onComplete: () => void;
  onSkip?: () => void;
  onBack?: () => void;
  showSkip?: boolean;
  showBack?: boolean;
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
    description: 'The essential app store for Unraid. Access thousands of applications.',
    url: 'https://raw.githubusercontent.com/unraid/community.applications/master/plugins/community.applications.plg',
  },
  {
    id: 'fix-common-problems',
    name: 'Fix Common Problems',
    description: 'Diagnostic tool to help you identify and resolve configuration issues.',
    url: 'https://raw.githubusercontent.com/unraid/fix.common.problems/master/plugins/fix.common.problems.plg',
  },
  {
    id: 'tailscale',
    name: 'Tailscale',
    description: 'Zero-config VPN. Securely access your server from anywhere.',
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

// Default to selecting all plugins initially (optional, but good for UX)
const selectedPlugins = ref<Set<string>>(new Set(['community-apps', 'fix-common-problems']));
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

const togglePlugin = (pluginId: string, value: boolean) => {
  if (installedPluginIds.value.has(pluginId) || isBusy.value) {
    return;
  }

  const next = new Set(selectedPlugins.value);
  if (value) {
    next.add(pluginId);
    if (pluginStates[pluginId].status !== 'pending') {
      pluginStates[pluginId].status = 'pending';
      pluginStates[pluginId].logs = [];
    }
  } else {
    next.delete(pluginId);
    pluginStates[pluginId].status = 'pending';
    pluginStates[pluginId].logs = [];
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
    // After install, check if successful and proceed?
    // The current logic sets installationFinished, and next click will complete.
    // Ideally, we auto-complete if successful.
    if (!error.value && installationFinished.value) {
      props.onComplete();
    }
  }
};

const primaryButtonText = computed(() => {
  if (isInstalling.value) return t('activation.pluginsStep.installing');
  return 'Next Step'; // Hardcoded as per design or use t key
});
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4 pb-4 md:px-8">
    <div class="bg-elevated border-muted rounded-xl border p-6 text-left shadow-sm md:p-10">
      <!-- Header -->
      <div class="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <Squares2X2Icon class="text-primary h-8 w-8" />
            <h2 class="text-highlighted text-3xl font-extrabold tracking-tight uppercase">
              {{ t('activation.pluginsStep.title', 'PLUGINS') }}
            </h2>
          </div>
          <p class="text-muted text-lg">
            {{
              t(
                'activation.pluginsStep.description',
                "Extend your server's capabilities with community tools."
              )
            }}
          </p>
        </div>
      </div>

      <!-- Pro Tip -->
      <blockquote class="border-primary bg-primary-100 text my-8 border-s-4 p-4">
        <div class="flex items-start gap-2">
          <InformationCircleIcon class="text-primary mt-0.5 h-6 w-6 flex-shrink-0" />
          <p class="text-sm leading-relaxed">
            <span class="mr-1 mb-1 block">{{ t('activation.pluginsStep.tip') }}</span>
          </p>
        </div>
      </blockquote>

      <!-- Plugin List -->
      <div class="mb-8 grid gap-4">
        <div
          v-for="plugin in availablePlugins"
          :key="plugin.id"
          class="border-muted bg-bg hover:border-primary/50 flex items-center justify-between rounded-lg border p-5 transition-colors"
        >
          <div class="flex-1 pr-4">
            <h3 class="text-highlighted mb-1 text-base font-bold">
              {{ plugin.name }}
            </h3>
            <p class="text-muted text-sm leading-relaxed">
              {{ plugin.description }}
            </p>
            <!-- Install Status Text -->
            <p
              v-if="pluginStates[plugin.id].status === 'installing'"
              class="text-primary mt-2 flex items-center gap-1 text-xs"
            >
              <span
                class="border-primary h-3 w-3 animate-spin rounded-full border-2 border-t-transparent"
              />
              Installing...
            </p>
            <p
              v-else-if="pluginStates[plugin.id].status === 'success'"
              class="mt-2 text-xs font-medium text-green-600"
            >
              Installed Successfully
            </p>
            <p
              v-else-if="pluginStates[plugin.id].status === 'error'"
              class="mt-2 text-xs font-medium text-red-500"
            >
              Installation Failed
            </p>
          </div>

          <Switch
            :model-value="selectedPlugins.has(plugin.id)"
            @update:model-value="(val: boolean) => togglePlugin(plugin.id, val)"
            :disabled="isBusy || isPluginInstalled(plugin.id)"
            :class="[
              selectedPlugins.has(plugin.id) ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700',
              'focus:ring-primary relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            ]"
          >
            <span class="sr-only">Enable {{ plugin.name }}</span>
            <span
              aria-hidden="true"
              :class="[
                selectedPlugins.has(plugin.id) ? 'translate-x-5' : 'translate-x-0',
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
              ]"
            />
          </Switch>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10"
      >
        <p class="text-center text-sm font-medium text-red-600 dark:text-red-400">
          {{ error }}
        </p>
      </div>

      <div
        class="border-muted flex flex-col-reverse items-center justify-between gap-6 border-t pt-8 sm:flex-row"
      >
        <button
          v-if="showBack"
          @click="handleBack"
          class="text-muted hover:text-toned group flex w-full items-center justify-center gap-2 font-medium transition-colors sm:w-auto sm:justify-start"
          :disabled="isBusy"
        >
          <ChevronLeftIcon class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
          {{ t('common.back') }}
        </button>
        <div v-else class="hidden w-1 sm:block" />

        <div class="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row">
          <button
            v-if="showSkip && !isInstalling"
            @click="handleSkip"
            class="text-muted hover:text-highlighted text-sm font-medium transition-colors sm:mr-2"
            :disabled="isBusy"
          >
            {{ t('common.skipForNow', 'Skip for now') }}
          </button>
          <BrandButton
            :text="primaryButtonText"
            class="!bg-primary hover:!bg-primary/90 w-full min-w-[160px] font-bold tracking-wide !text-white uppercase shadow-md transition-all hover:shadow-lg sm:w-auto"
            :disabled="isBusy"
            :loading="isBusy"
            @click="handlePrimaryAction"
            :icon-right="ChevronRightIcon"
          />
        </div>
      </div>
    </div>
  </div>
</template>
