<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery } from '@vue/apollo-composable';

import { ChevronLeftIcon, Squares2X2Icon } from '@heroicons/vue/24/outline';
import { ChevronRightIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';
import OnboardingLoadingState from '@/components/Onboarding/components/OnboardingLoadingState.vue';
import { INSTALLED_UNRAID_PLUGINS_QUERY } from '@/components/Onboarding/graphql/installedPlugins.query';

import type { OnboardingPluginsDraft } from '@/components/Onboarding/onboardingWizardState';

export interface Props {
  initialDraft?: OnboardingPluginsDraft | null;
  onComplete: (draft: OnboardingPluginsDraft) => void | Promise<void>;
  onSkip?: (draft: OnboardingPluginsDraft) => void | Promise<void>;
  onBack?: (draft: OnboardingPluginsDraft) => void | Promise<void>;
  showSkip?: boolean;
  showBack?: boolean;
  isSavingStep?: boolean;
  saveError?: string | null;
}

const props = defineProps<Props>();
const { t } = useI18n();

const normalizePluginFileName = (value: string) => value.trim().toLowerCase();

const getPluginFileName = (url: string) => {
  const parts = url.split('/');
  return parts[parts.length - 1] ?? url;
};

const availablePlugins = computed(
  () =>
    [
      {
        id: 'community-apps',
        name: t('onboarding.pluginsStep.plugins.communityApps.name'),
        description: t('onboarding.pluginsStep.plugins.communityApps.description'),
        url: 'https://raw.githubusercontent.com/unraid/community.applications/master/plugins/community.applications.plg',
      },
      {
        id: 'fix-common-problems',
        name: t('onboarding.pluginsStep.plugins.fixCommonProblems.name'),
        description: t('onboarding.pluginsStep.plugins.fixCommonProblems.description'),
        url: 'https://raw.githubusercontent.com/unraid/fix.common.problems/master/plugins/fix.common.problems.plg',
      },
      {
        id: 'tailscale',
        name: t('onboarding.pluginsStep.plugins.tailscale.name'),
        description: t('onboarding.pluginsStep.plugins.tailscale.description'),
        url: 'https://raw.githubusercontent.com/unraid/unraid-tailscale/main/plugin/tailscale.plg',
      },
    ] as const
);

const pluginInstalledFileAliases: Partial<Record<string, string[]>> = {
  tailscale: ['tailscale-preview.plg'],
};

const getPluginInstallDetectionFileNames = (plugin: { id: string; url: string }): Set<string> => {
  const fileNames = new Set<string>([normalizePluginFileName(getPluginFileName(plugin.url))]);
  const aliases = pluginInstalledFileAliases[plugin.id] ?? [];
  for (const alias of aliases) {
    fileNames.add(normalizePluginFileName(alias));
  }
  return fileNames;
};

const defaultSelectedPluginIds = new Set<string>(['community-apps']);
const buildSelectedPluginsFromDraft = (draft?: OnboardingPluginsDraft | null) => {
  if (!draft || draft.selectedIds === undefined) {
    return new Set(defaultSelectedPluginIds);
  }

  return new Set(draft.selectedIds);
};

const selectedPlugins = ref<Set<string>>(buildSelectedPluginsFromDraft(props.initialDraft));
const installedPluginIds = ref<Set<string>>(new Set());

const { result: installedPluginsResult, loading: installedPluginsLoading } = useQuery(
  INSTALLED_UNRAID_PLUGINS_QUERY,
  null,
  {
    fetchPolicy: 'network-only',
  }
);

const isPluginInstalled = (pluginId: string) => installedPluginIds.value.has(pluginId);
const isPluginEnabled = (pluginId: string) =>
  installedPluginIds.value.has(pluginId) || selectedPlugins.value.has(pluginId);
const isInstalledPluginsPending = computed(
  () =>
    installedPluginsLoading.value && !Array.isArray(installedPluginsResult.value?.installedUnraidPlugins)
);
const isBusy = computed(() => Boolean(props.isSavingStep) || isInstalledPluginsPending.value);
const stepError = computed(() => props.saveError ?? null);
const persistedSelectedPlugins = computed(
  () => new Set<string>([...selectedPlugins.value, ...installedPluginIds.value])
);
const buildDraftSnapshot = (): OnboardingPluginsDraft => ({
  selectedIds: Array.from(persistedSelectedPlugins.value),
});

const applyInstalledPlugins = (installedPlugins: string[] | null | undefined) => {
  if (!Array.isArray(installedPlugins)) {
    return;
  }

  const installedFiles = new Set(installedPlugins.map((name) => normalizePluginFileName(name)));
  const nextInstalledIds = new Set<string>();

  for (const plugin of availablePlugins.value) {
    const fileNames = getPluginInstallDetectionFileNames(plugin);
    const hasMatch = Array.from(fileNames).some((fileName) => installedFiles.has(fileName));
    if (hasMatch) {
      nextInstalledIds.add(plugin.id);
    }
  }

  installedPluginIds.value = nextInstalledIds;

  // Auto-select uninstalled recommended plugins, but maybe respect user choice?
  // Current logic: If installed, add to selection?
  // If installed, we probably can't "install" it again easily, but we can verify it.
  // We'll leave them selected if they are installed, or disable them?
};

watch(
  () => installedPluginsResult.value?.installedUnraidPlugins,
  (installedPlugins) => {
    applyInstalledPlugins(installedPlugins);
  },
  { immediate: true }
);

watch(
  () => props.initialDraft,
  (draft) => {
    selectedPlugins.value = buildSelectedPluginsFromDraft(draft);
  }
);

const togglePlugin = (pluginId: string, value: boolean) => {
  if (installedPluginIds.value.has(pluginId) || isBusy.value) {
    return;
  }

  const next = new Set(selectedPlugins.value);
  if (value) {
    next.add(pluginId);
  } else {
    next.delete(pluginId);
  }
  selectedPlugins.value = next;
};

const handleSkip = async () => {
  const draft: OnboardingPluginsDraft = {
    selectedIds: Array.from(installedPluginIds.value),
  };
  if (props.onSkip) {
    await props.onSkip(draft);
  } else {
    await props.onComplete(draft);
  }
};

const handleBack = async () => {
  await props.onBack?.(buildDraftSnapshot());
};

const handlePrimaryAction = async () => {
  await props.onComplete(buildDraftSnapshot());
};

const primaryButtonText = computed(() => t('onboarding.pluginsStep.nextStep'));
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4 pb-4 md:px-8">
    <OnboardingLoadingState
      v-if="props.isSavingStep"
      :title="t('onboarding.loading.title')"
      :description="t('onboarding.loading.description')"
    />

    <div v-else class="bg-elevated border-muted rounded-xl border p-6 text-left shadow-sm md:p-10">
      <!-- Header -->
      <div class="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <Squares2X2Icon class="text-primary h-8 w-8" />
            <h2 class="text-highlighted text-3xl font-extrabold tracking-tight uppercase">
              {{ t('onboarding.pluginsStep.title', 'PLUGINS') }}
            </h2>
          </div>
          <p class="text-muted text-lg">
            {{
              t(
                'onboarding.pluginsStep.description',
                "Extend your server's capabilities with community tools."
              )
            }}
          </p>
        </div>
      </div>

      <!-- Pro Tip -->
      <UAlert
        class="my-8"
        color="primary"
        variant="subtle"
        icon="i-lucide-info"
        :description="t('onboarding.pluginsStep.tip')"
      />

      <!-- Plugin List -->
      <div class="mb-8">
        <OnboardingLoadingState
          v-if="isInstalledPluginsPending"
          compact
          :title="t('onboarding.loading.title')"
          :description="t('onboarding.pluginsStep.loading.description')"
        />
        <div v-else class="grid gap-4">
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
            </div>

            <USwitch
              :model-value="isPluginEnabled(plugin.id)"
              @update:model-value="(val: boolean) => togglePlugin(plugin.id, val)"
              :disabled="isBusy || isPluginInstalled(plugin.id)"
              :aria-label="t('onboarding.pluginsStep.enablePluginAria', { name: plugin.name })"
            />
          </div>
        </div>
      </div>

      <div
        v-if="stepError"
        class="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10"
      >
        <p class="text-center text-sm font-medium text-red-600 dark:text-red-400">
          {{ stepError }}
        </p>
      </div>

      <div
        class="border-muted flex flex-col-reverse items-center justify-between gap-6 border-t pt-8 sm:flex-row"
      >
        <button
          v-if="showBack"
          @click="handleBack"
          class="text-muted hover:text-toned group flex w-full items-center justify-center gap-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:justify-start"
          :disabled="isBusy"
        >
          <ChevronLeftIcon class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
          {{ t('common.back') }}
        </button>
        <div v-else class="hidden w-1 sm:block" />

        <div class="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row">
          <button
            v-if="showSkip"
            @click="handleSkip"
            class="text-muted hover:text-highlighted text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:mr-2"
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
