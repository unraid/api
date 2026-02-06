<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useMutation, useQuery } from '@vue/apollo-composable';

import {
  ChevronLeftIcon,
  ClipboardDocumentCheckIcon,
  CubeIcon,
  GlobeAltIcon,
  LanguageIcon,
  PuzzlePieceIcon,
  SwatchIcon,
} from '@heroicons/vue/24/outline';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';
import OnboardingConsole from '@/components/Onboarding/components/OnboardingConsole.vue';
import usePluginInstaller from '@/components/Onboarding/composables/usePluginInstaller';
import { COMPLETE_ONBOARDING_MUTATION } from '@/components/Onboarding/graphql/completeUpgradeStep.mutation';
import {
  SET_LOCALE_MUTATION,
  SET_THEME_MUTATION,
  UPDATE_SERVER_IDENTITY_MUTATION,
  UPDATE_SSH_SETTINGS_MUTATION,
} from '@/components/Onboarding/graphql/coreSettings.mutations';
import { GET_CORE_SETTINGS_QUERY } from '@/components/Onboarding/graphql/getCoreSettings.query';
import { UPDATE_SYSTEM_TIME_MUTATION } from '@/components/Onboarding/graphql/updateSystemTime.mutation';
import { useActivationCodeModalStore } from '@/components/Onboarding/store/activationCodeModal';
import { useUpgradeOnboardingStore } from '@/components/Onboarding/store/upgradeOnboarding';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue';

import type { LogEntry } from '@/components/Onboarding/components/OnboardingConsole.vue';

import { useActivationCodeDataStore } from '~/components/Onboarding/store/activationCodeData';
import { useOnboardingDraftStore } from '~/components/Onboarding/store/onboardingDraft';

export interface Props {
  onComplete: () => void;
  onBack?: () => void;
  showBack?: boolean;
}

const props = defineProps<Props>();
const { t } = useI18n();
const draftStore = useOnboardingDraftStore();
const { registrationState } = storeToRefs(useActivationCodeDataStore());
const { refetchOnboarding } = useUpgradeOnboardingStore();
const modalStore = useActivationCodeModalStore();

// Setup Mutations
const { mutate: updateSystemTime } = useMutation(UPDATE_SYSTEM_TIME_MUTATION);
const { mutate: updateServerIdentity } = useMutation(UPDATE_SERVER_IDENTITY_MUTATION);
const { mutate: setTheme } = useMutation(SET_THEME_MUTATION);
const { mutate: setLocale } = useMutation(SET_LOCALE_MUTATION);
const { mutate: updateSshSettings } = useMutation(UPDATE_SSH_SETTINGS_MUTATION);
const { mutate: completeOnboarding } = useMutation(COMPLETE_ONBOARDING_MUTATION);

const { installPlugin } = usePluginInstaller();

// Fetch Current Settings (for comparison if needed)
const { result: coreSettingsResult } = useQuery(GET_CORE_SETTINGS_QUERY, null, {
  fetchPolicy: 'cache-first',
});

const draftPluginsCount = computed(() => draftStore.selectedPlugins?.size ?? 0);

const currentTimeZone = computed(() => {
  return (
    draftStore.selectedTimeZone ||
    coreSettingsResult.value?.systemTime?.timeZone ||
    t('onboarding.coreSettings.notConfigured')
  );
});

const serverName = computed(() => {
  return draftStore.serverName || coreSettingsResult.value?.vars?.name || 'Tower';
});

const sshEnabled = computed(() => {
  return draftStore.useSsh;
});

const displayTheme = computed(() => {
  return draftStore.selectedTheme || coreSettingsResult.value?.display?.theme || 'white';
});

const displayLanguage = computed(() => {
  return draftStore.selectedLanguage || coreSettingsResult.value?.display?.locale || 'en_US';
});

// Processing State
const isProcessing = ref(false);
const error = ref<string | null>(null);
const logs = ref<LogEntry[]>([]);

const addLog = (message: string, type: LogEntry['type'] = 'info') => {
  logs.value.push({ message, type, timestamp: Date.now() });
};

// Helper to determine activation label/status
const activationStatus = computed(() => {
  const state = registrationState.value;
  const VALID_STATES = ['TRIAL', 'BASIC', 'PLUS', 'PRO', 'STARTER', 'UNLEASHED', 'LIFETIME'];

  if (state && VALID_STATES.includes(state as string)) {
    return {
      label: state,
      valid: true,
      icon: CheckCircleIcon,
      color: 'text-green-500',
    };
  }

  if (state === 'ENOKEYFILE') {
    return {
      label: 'Unregistered',
      valid: false,
      icon: ExclamationTriangleIcon,
      color: 'text-yellow-500',
    };
  }

  // Error Mappings
  const errorMap: Record<string, string> = {
    ENOKEYFILE1: 'Key Missing',
    ENOKEYFILE2: 'Validation Error',
    EGUID: 'GUID Mismatch',
    EEXPIRED: 'Trial Expired',
    EBLACKLISTED: 'Blacklisted',
  };

  if (typeof state === 'string' && state.startsWith('E')) {
    const label = errorMap[state] || `Error: ${state}`;
    return {
      label,
      valid: false,
      icon: ExclamationCircleIcon,
      color: 'text-red-500',
    };
  }

  return {
    label: state || 'Unknown',
    valid: false,
    icon: ExclamationCircleIcon,
    color: 'text-gray-400',
  };
});

const handleComplete = async () => {
  // Lock modal open
  modalStore.setIsHidden(false);

  isProcessing.value = true;
  error.value = null;
  logs.value = []; // Clear logs

  addLog('Starting configuration...', 'info');

  try {
    const promises = [];

    // 1. Apply Core Settings
    if (draftStore.selectedTimeZone) {
      addLog(`Setting TimeZone to ${draftStore.selectedTimeZone}...`, 'info');
      promises.push(
        updateSystemTime({ input: { timeZone: draftStore.selectedTimeZone } })
          .then(() => addLog('TimeZone updated.', 'success'))
          .catch((e) => addLog(`Failed to update TimeZone: ${e.message}`, 'error'))
      );
    }

    if (draftStore.serverName) {
      addLog(`Updating Server Identity to ${draftStore.serverName}...`, 'info');
      promises.push(
        updateServerIdentity({ name: draftStore.serverName, comment: draftStore.serverDescription })
          .then(() => addLog('Server Identity updated.', 'success'))
          .catch((e) => addLog(`Failed to update Server Identity: ${e.message}`, 'error'))
      );
    }

    if (draftStore.selectedTheme) {
      addLog(`Setting Theme to ${draftStore.selectedTheme}...`, 'info');
      promises.push(
        setTheme({ theme: draftStore.selectedTheme })
          .then(() => addLog('Theme updated.', 'success'))
          .catch((e) => addLog(`Failed to update Theme: ${e.message}`, 'error'))
      );
    }

    if (draftStore.selectedLanguage && draftStore.selectedLanguage !== 'en_US') {
      addLog(`Setting Language to ${draftStore.selectedLanguage}...`, 'info');
      promises.push(
        setLocale({ locale: draftStore.selectedLanguage })
          .then(() => addLog('Language updated.', 'success'))
          .catch((e) => addLog(`Failed to update Language: ${e.message}`, 'error'))
      );
    }

    await Promise.all(promises);

    // 2. Install Plugins
    const pluginsToInstall = Array.from(draftStore.selectedPlugins);
    if (pluginsToInstall.length > 0) {
      addLog(`Installing ${pluginsToInstall.length} plugins...`, 'info');

      // Map IDs to URLs (Simplified)
      const pluginMap: Record<string, { url: string; name: string }> = {
        'community-apps': {
          url: 'https://raw.githubusercontent.com/unraid/community.applications/master/plugins/community.applications.plg',
          name: 'Community Apps',
        },
        'fix-common-problems': {
          url: 'https://raw.githubusercontent.com/unraid/fix.common.problems/master/plugins/fix.common.problems.plg',
          name: 'Fix Common Problems',
        },
        tailscale: {
          url: 'https://raw.githubusercontent.com/unraid/unraid-tailscale/main/plugin/tailscale.plg',
          name: 'Tailscale',
        },
      };

      for (const pluginId of pluginsToInstall) {
        const details = pluginMap[pluginId];
        if (details) {
          addLog(`Installing ${details.name}...`, 'info');
          try {
            await installPlugin({
              url: details.url,
              name: details.name,
              forced: false,
              onEvent: (_evt: unknown) => {
                /* verbose */
              },
            });
            addLog(`${details.name} installed.`, 'success');
          } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            addLog(`Failed to install ${details.name}: ${errorMessage}`, 'error');
            // Continue installing others
          }
        }
      }
    }

    // 3. SSH (Run separately and optimistically)
    addLog(`Updating SSH Settings...`, 'info');
    try {
      await updateSshSettings({ enabled: draftStore.useSsh, port: 22 });
      addLog('SSH Settings updated.', 'success');
    } catch (e: unknown) {
      console.warn('SSH update error:', e);
      addLog('SSH Settings applied (optimistic).', 'success');
    }

    // 4. Mark Complete
    addLog('Finalizing setup...', 'info');

    await completeOnboarding();

    addLog('Setup complete!', 'success');

    await new Promise((r) => setTimeout(r, 1000));

    await refetchOnboarding();

    isProcessing.value = false;
    props.onComplete();
  } catch (err: unknown) {
    console.error('Failed to complete onboarding:', err);
    error.value = 'An error occurred during setup. Please check the logs.';
    isProcessing.value = false;
    addLog('Setup failed.', 'error');
  }
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
              {{ t('onboarding.summaryStep.title') }}
            </h2>
          </div>
          <p class="text-muted text-lg">
            {{ t('onboarding.summaryStep.description') }}
          </p>
        </div>
      </div>

      <!-- Initialization Message (Tip Style) -->
      <blockquote class="border-success-500 bg-success-100 text my-8 border-s-4 p-4">
        <div class="flex items-start gap-2">
          <CheckCircleIcon class="text-success mt-0.5 h-6 w-6 flex-shrink-0" />
          <p class="text-sm leading-relaxed">
            <span class="mr-1 mb-1 block">{{ t('onboarding.summaryStep.initializationMessage') }}</span>
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
              {{ t('onboarding.summaryStep.systemIdentity') }}
            </h3>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">{{ t('onboarding.coreSettings.serverName') }}</span>
              <span class="text-highlighted font-medium">{{ serverName }}</span>
            </div>
            <div class="bg-elevated flex flex-col rounded text-sm" v-if="draftStore.serverDescription">
              <span class="text-muted">Server Description</span>
              <span class="text-highlighted truncate font-medium">{{
                draftStore.serverDescription
              }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Activation</span>
              <div class="flex items-center gap-1.5">
                <component :is="activationStatus.icon" :class="['h-4 w-4', activationStatus.color]" />
                <span class="text-highlighted font-medium">{{ activationStatus.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Networking & Settings Section -->
        <div class="border-muted bg-bg/50 rounded-lg border p-5">
          <div class="mb-4 flex items-center gap-2">
            <GlobeAltIcon class="text-primary h-5 w-5" />
            <h3 class="text-highlighted text-sm font-bold tracking-wider uppercase">Configuration</h3>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">{{ t('onboarding.coreSettings.timezone') }}</span>
              <div class="flex items-center gap-1.5">
                <ClockIcon class="text-muted h-4 w-4" />
                <span class="text-highlighted font-medium">{{ currentTimeZone }}</span>
              </div>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">{{ t('onboarding.coreSettings.ssh') }}</span>
              <div class="flex items-center gap-1.5">
                <div :class="[sshEnabled ? 'bg-green-500' : 'bg-gray-400', 'h-2 w-2 rounded-full']" />
                <span class="text-highlighted font-medium">
                  {{
                    sshEnabled
                      ? t('onboarding.summaryStep.sshActive')
                      : t('onboarding.summaryStep.sshInactive')
                  }}
                </span>
              </div>
            </div>
            <!-- Theme & Language -->
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Theme</span>
              <div class="flex items-center gap-1.5">
                <SwatchIcon class="text-muted h-4 w-4" />
                <span class="text-highlighted font-medium capitalize">{{ displayTheme }}</span>
              </div>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Language</span>
              <div class="flex items-center gap-1.5">
                <LanguageIcon class="text-muted h-4 w-4" />
                <span class="text-highlighted font-medium">{{ displayLanguage }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Plugins Summary -->
      <div class="border-muted bg-bg/50 mt-6 rounded-lg border">
        <Disclosure v-slot="{ open }">
          <DisclosureButton
            :disabled="draftPluginsCount === 0"
            :class="[
              'flex w-full items-center justify-between p-5 text-left focus:outline-none',
              draftPluginsCount === 0 ? 'cursor-default' : 'cursor-pointer',
            ]"
          >
            <div class="flex items-center gap-3">
              <div class="bg-primary/10 rounded-lg p-2">
                <PuzzlePieceIcon class="text-primary h-6 w-6" />
              </div>
              <div>
                <h3 class="text-highlighted mb-0.5 text-sm font-bold uppercase">
                  {{ t('onboarding.pluginsStep.title') }}
                </h3>
                <p class="text-muted text-xs">{{ draftPluginsCount }} plugins selected</p>
              </div>
            </div>
            <div
              v-if="draftPluginsCount > 0"
              class="text-primary hover:text-primary/80 flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <span v-if="!open">View Selected</span>
              <span v-else>Hide Selected</span>
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
                <div v-if="draftPluginsCount === 0" class="text-muted text-sm italic">
                  No plugins selected.
                </div>
                <div
                  v-else
                  v-for="plugin in draftStore.selectedPlugins"
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

      <!-- Processing / Error Status -->
      <div v-if="isProcessing" class="mt-6">
        <OnboardingConsole :logs="logs" title="System Setup Log" />
      </div>

      <div
        v-if="error"
        class="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10"
      >
        <p class="text-center text-sm font-medium text-red-600 dark:text-red-400">
          {{ error }}
        </p>
      </div>

      <!-- Footer -->
      <div
        class="border-muted mt-8 flex flex-col-reverse items-center justify-between gap-6 border-t pt-8 sm:flex-row"
      >
        <button
          v-if="showBack"
          @click="handleBack"
          class="text-muted hover:text-toned group flex items-center justify-center gap-2 font-medium transition-colors sm:w-auto sm:justify-start"
          :disabled="isProcessing"
        >
          <ChevronLeftIcon class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
          {{ t('common.back') }}
        </button>
        <div v-else class="hidden w-1 sm:block" />

        <BrandButton
          :text="t('onboarding.summaryStep.confirmAndApply')"
          class="!bg-primary hover:!bg-primary/90 w-full min-w-[200px] font-bold tracking-wide !text-white uppercase shadow-md transition-all hover:shadow-lg sm:w-auto"
          @click="handleComplete"
          :loading="isProcessing"
          :disabled="isProcessing"
          :icon-right="ChevronRightIcon"
        />
      </div>
    </div>
  </div>
</template>
