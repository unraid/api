<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery } from '@vue/apollo-composable';

import { ChevronLeftIcon, Squares2X2Icon } from '@heroicons/vue/24/outline';
import { ChevronRightIcon, InformationCircleIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';
import { INSTALLED_UNRAID_PLUGINS_QUERY } from '@/components/Activation/graphql/installedPlugins.query';
import { useOnboardingDraftStore } from '@/components/Activation/store/onboardingDraft';
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
const draftStore = useOnboardingDraftStore();

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

// Default to selecting all plugins initially (optional, but good for UX)
// But if draft store has values (even empty set if user deselected all), respect that?
// We need to differentiate "first visit" vs "returning visit".
// Checking if draft store is populated is a good hint.
const initialSelection =
  draftStore.selectedPlugins.size > 0
    ? new Set(draftStore.selectedPlugins)
    : new Set(['community-apps', 'fix-common-problems']); // Default

const selectedPlugins = ref<Set<string>>(initialSelection);
const installedPluginIds = ref<Set<string>>(new Set());

const { result: installedPluginsResult } = useQuery(INSTALLED_UNRAID_PLUGINS_QUERY, null, {
  fetchPolicy: 'network-only',
});

const isPluginInstalled = (pluginId: string) => installedPluginIds.value.has(pluginId);
const isBusy = computed(() => props.isSavingStep ?? false);

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

const isJigglingLeft = ref(false);
const isJigglingRight = ref(false);

const triggerJiggleLeft = () => {
  if (isJigglingLeft.value) return;
  isJigglingLeft.value = true;
  setTimeout(() => {
    isJigglingLeft.value = false;
  }, 400);
};

const triggerJiggleRight = () => {
  if (isJigglingRight.value) return;
  isJigglingRight.value = true;
  setTimeout(() => {
    isJigglingRight.value = false;
  }, 400);
};

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

const handleSkip = () => {
  // Clear selection? Or just move on?
  // User clicked "Skip", so we probably shouldn't install anything.
  draftStore.setPlugins(new Set());
  if (props.onSkip) {
    props.onSkip();
  } else {
    props.onComplete();
  }
};

const handleBack = () => {
  props.onBack?.();
};

const handlePrimaryAction = async () => {
  draftStore.setPlugins(selectedPlugins.value);
  props.onComplete();
};

const primaryButtonText = computed(() => 'Next Step');
</script>

<template>
  <div class="relative mx-auto flex w-full max-w-6xl items-center justify-center px-4 pb-4 md:px-8">
    <!-- Left Decor Card -->
    <div
      @click="triggerJiggleLeft"
      :class="{ 'animate-jiggle-left': isJigglingLeft }"
      class="absolute top-1/2 left-0 z-0 hidden h-[80%] w-[300px] -translate-x-12 -translate-y-1/2 scale-90 -rotate-6 transform overflow-hidden rounded-xl opacity-80 shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-x-20 hover:scale-95 hover:-rotate-3 hover:cursor-pointer hover:opacity-100 xl:block"
    >
      <img
        src="https://cdn.craft.cloud/481d40bf-939a-4dc1-918d-b4d4b48b7c04/assets/uploads/img_DoMoreWithCommunityApp.jpg?width=863&quality=100&fit=crop&s=p28hSLnHzCsBYd9QcPaxkmf6PYCxnM-o8W88fnPPjuU"
        class="h-full w-full object-cover"
        alt="Community Apps"
      />
    </div>

    <!-- Right Decor Card -->
    <div
      @click="triggerJiggleRight"
      :class="{ 'animate-jiggle-right': isJigglingRight }"
      class="absolute top-1/2 right-0 z-0 hidden h-[80%] w-[300px] translate-x-12 -translate-y-1/2 scale-90 rotate-6 transform overflow-hidden rounded-xl opacity-80 shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:translate-x-20 hover:scale-95 hover:rotate-3 hover:cursor-pointer hover:opacity-100 xl:block"
    >
      <img
        src="https://cdn.craft.cloud/481d40bf-939a-4dc1-918d-b4d4b48b7c04/assets/uploads/img_BuildDifferent_2024-02-03-002039_rzqy.jpg?width=863&quality=100&fit=crop&s=LgyWuB6EyLmeBzoJz5vyQhlu8RVJbooDhjy5Ie-SWyg"
        class="h-full w-full object-cover"
        alt="Build Different"
      />
    </div>

    <!-- Main Card -->
    <div
      class="bg-elevated border-muted bg-opacity-95 relative z-10 w-full max-w-4xl rounded-xl border p-6 text-left shadow-sm backdrop-blur-sm md:p-10"
    >
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
            v-if="showSkip"
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

<style scoped>
@keyframes wobble-left {
  0% {
    transform: rotate(-6deg) scale(0.9);
  }

  25% {
    transform: rotate(-8deg) scale(0.9);
  }

  50% {
    transform: rotate(-6deg) scale(0.9);
  }

  75% {
    transform: rotate(-4deg) scale(0.9);
  }

  100% {
    transform: rotate(-6deg) scale(0.9);
  }
}

@keyframes wobble-right {
  0% {
    transform: rotate(6deg) scale(0.9);
  }

  25% {
    transform: rotate(8deg) scale(0.9);
  }

  50% {
    transform: rotate(6deg) scale(0.9);
  }

  75% {
    transform: rotate(4deg) scale(0.9);
  }

  100% {
    transform: rotate(6deg) scale(0.9);
  }
}

.animate-wobble-left {
  animation: wobble-left 0.4s ease-in-out infinite;
}

.animate-wobble-right {
  animation: wobble-right 0.4s ease-in-out infinite;
}

@keyframes jiggle-left {
  0% {
    transform: rotate(-3deg);
  }

  25% {
    transform: rotate(-6deg);
  }

  50% {
    transform: rotate(0deg);
  }

  75% {
    transform: rotate(-5deg);
  }

  100% {
    transform: rotate(-3deg);
  }
}

@keyframes jiggle-right {
  0% {
    transform: rotate(3deg);
  }

  25% {
    transform: rotate(6deg);
  }

  50% {
    transform: rotate(0deg);
  }

  75% {
    transform: rotate(5deg);
  }

  100% {
    transform: rotate(3deg);
  }
}

.animate-jiggle-left {
  animation: jiggle-left 0.4s ease-in-out;
}

.animate-jiggle-right {
  animation: jiggle-right 0.4s ease-in-out;
}
</style>
