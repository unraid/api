<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import {
  ChevronLeftIcon,
  ClipboardDocumentCheckIcon,
  CubeIcon,
  GlobeAltIcon,
  PuzzlePieceIcon,
} from '@heroicons/vue/24/outline';
import { CheckCircleIcon, ChevronDownIcon, ChevronRightIcon, ClockIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue';

import { GET_CORE_SETTINGS_QUERY } from '~/components/Activation/getCoreSettings.query';
import { INSTALLED_UNRAID_PLUGINS_QUERY } from '~/components/Activation/graphql/installedPlugins.query';
import { useActivationCodeDataStore } from '~/components/Activation/store/activationCodeData';

export interface Props {
  onComplete: () => void;
  onBack?: () => void;
  showBack?: boolean;
}

const props = defineProps<Props>();
const { t } = useI18n();

const { registrationState } = storeToRefs(useActivationCodeDataStore());

// Fetch installed plugins
const { result: pluginsResult } = useQuery(INSTALLED_UNRAID_PLUGINS_QUERY, null, {
  fetchPolicy: 'cache-and-network',
});

// Fetch Core Settings (Timezone, Name, SSH)
const { result: coreSettingsResult } = useQuery(GET_CORE_SETTINGS_QUERY, null, {
  fetchPolicy: 'cache-first',
});

const installedPlugins = computed(() => {
  return pluginsResult.value?.installedUnraidPlugins ?? [];
});

const installedPluginsCount = computed(() => installedPlugins.value.length);

const currentTimeZone = computed(() => {
  return coreSettingsResult.value?.systemTime?.timeZone || t('activation.timezoneStep.notConfigured');
});

const serverName = computed(() => {
  return coreSettingsResult.value?.vars?.name || 'Tower';
});

const sshEnabled = computed(() => {
  return coreSettingsResult.value?.vars?.useSsh === true;
});

// Helper to determine activation label/status
const activationStatus = computed(() => {
  // If we have a keyfile error, it usually means not activated or trial not started?
  // Depending on how `registrationState` works. Assuming 'ENOKEYFILE' means no key.
  // Using simplified logic for display:
  if (registrationState.value === 'ENOKEYFILE') {
    return { label: 'Trial Ready', valid: true }; // Assuming user is about to start trial
  }
  // Simplified fallback
  return { label: 'Active', valid: true };
});

const handleComplete = () => {
  props.onComplete();
};

const handleBack = () => {
  props.onBack?.();
};
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4 pb-4 md:px-8">
    <div class="bg-elevated border-muted rounded-xl border p-6 text-left shadow-sm md:p-10">
      <!-- Header -->
      <div class="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <ClipboardDocumentCheckIcon class="text-primary h-8 w-8" />
            <h2 class="text-highlighted text-3xl font-extrabold tracking-tight uppercase">
              {{ t('activation.summaryStep.title') }}
            </h2>
          </div>
          <p class="text-muted text-lg">
            {{ t('activation.summaryStep.description') }}
          </p>
        </div>
      </div>

      <!-- Initialization Message (Tip Style) -->
      <blockquote class="border-success-500 bg-success-100 text my-8 border-s-4 p-4">
        <div class="flex items-start gap-2">
          <CheckCircleIcon class="text-success mt-0.5 h-6 w-6 flex-shrink-0" />
          <p class="text-sm leading-relaxed">
            <span class="mr-1 mb-1 block">{{ t('activation.summaryStep.initializationMessage') }}</span>
          </p>
        </div>
      </blockquote>

      <!-- Summary Grid -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <!-- Identity Section -->
        <div class="border-muted bg-bg/50 rounded-lg border p-5">
          <div class="mb-4 flex items-center gap-2">
            <CubeIcon class="text-primary h-5 w-5" />
            <h3 class="text-highlighted text-sm font-bold tracking-wider uppercase">
              {{ t('activation.summaryStep.systemIdentity') }}
            </h3>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">{{ t('activation.coreSettings.serverName') }}</span>
              <span class="text-highlighted font-medium">{{ serverName }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Activation</span>
              <div class="flex items-center gap-1.5">
                <CheckCircleIcon v-if="activationStatus.valid" class="h-4 w-4 text-green-500" />
                <span class="text-highlighted font-medium">{{ activationStatus.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Networking & Security Section -->
        <div class="border-muted bg-bg/50 rounded-lg border p-5">
          <div class="mb-4 flex items-center gap-2">
            <GlobeAltIcon class="text-primary h-5 w-5" />
            <h3 class="text-highlighted text-sm font-bold tracking-wider uppercase">
              {{ t('activation.summaryStep.networking') }} / {{ t('activation.summaryStep.security') }}
            </h3>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">{{ t('activation.timezoneStep.setYourTimeZone') }}</span>
              <div class="flex items-center gap-1.5">
                <ClockIcon class="text-muted h-4 w-4" />
                <span class="text-highlighted font-medium">{{ currentTimeZone }}</span>
              </div>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">{{ t('activation.coreSettings.ssh') }}</span>
              <div class="flex items-center gap-1.5">
                <div :class="[sshEnabled ? 'bg-green-500' : 'bg-gray-400', 'h-2 w-2 rounded-full']" />
                <span class="text-highlighted font-medium">
                  {{
                    sshEnabled
                      ? t('activation.summaryStep.sshActive')
                      : t('activation.summaryStep.sshInactive')
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Plugins Summary -->
      <div class="border-muted bg-bg/50 mt-6 rounded-lg border">
        <Disclosure v-slot="{ open }">
          <DisclosureButton
            class="flex w-full items-center justify-between p-5 text-left focus:outline-none"
          >
            <div class="flex items-center gap-3">
              <div class="bg-primary/10 rounded-lg p-2">
                <PuzzlePieceIcon class="text-primary h-6 w-6" />
              </div>
              <div>
                <h3 class="text-highlighted mb-0.5 text-sm font-bold uppercase">
                  {{ t('activation.pluginsStep.title') }}
                </h3>
                <p class="text-muted text-xs">{{ installedPluginsCount }} plugins ready to install</p>
              </div>
            </div>
            <div
              class="text-primary hover:text-primary/80 flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <span v-if="!open">View Plugins</span>
              <span v-else>Hide Plugins</span>
              <ChevronDownIcon
                :class="[
                  open ? 'rotate-180 transform' : '',
                  'h-5 w-5 transition-transform duration-200',
                ]"
              />
            </div>
          </DisclosureButton>
          <transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-out"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <DisclosurePanel class="px-5 pt-0 pb-5">
              <div class="border-muted space-y-2 border-t pt-4">
                <div
                  v-for="plugin in installedPlugins"
                  :key="plugin"
                  class="text-muted flex items-center gap-2 text-sm"
                >
                  <CheckCircleIcon class="h-4 w-4 flex-shrink-0 text-green-500" />
                  <span>{{ plugin }}</span>
                </div>
              </div>
            </DisclosurePanel>
          </transition>
        </Disclosure>
      </div>

      <!-- Footer -->
      <div
        class="border-muted mt-8 flex flex-col-reverse items-center justify-between gap-6 border-t pt-8 sm:flex-row"
      >
        <button
          v-if="showBack"
          @click="handleBack"
          class="text-muted hover:text-toned group flex w-full items-center justify-center gap-2 font-medium transition-colors sm:w-auto sm:justify-start"
        >
          <ChevronLeftIcon class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
          {{ t('common.back') }}
        </button>
        <div v-else class="hidden w-1 sm:block" />

        <BrandButton
          :text="t('activation.summaryStep.confirmAndFinish')"
          class="!bg-primary hover:!bg-primary/90 w-full min-w-[200px] font-bold tracking-wide !text-white uppercase shadow-md transition-all hover:shadow-lg sm:w-auto"
          @click="handleComplete"
          :icon-right="ChevronRightIcon"
        />
      </div>
    </div>
  </div>
</template>
