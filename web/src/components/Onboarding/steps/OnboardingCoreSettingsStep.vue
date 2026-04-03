<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import { ChevronLeftIcon, Cog6ToothIcon, GlobeAltIcon } from '@heroicons/vue/24/outline';
import { ChevronRightIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';
// --- Theme Images ---
import azureThemeImg from '@/assets/unraid-azure-theme.png';
import blackThemeImg from '@/assets/unraid-black-theme.png';
import grayThemeImg from '@/assets/unraid-gray-theme.png';
import whiteThemeImg from '@/assets/unraid-white-theme.png';
import OnboardingLoadingState from '@/components/Onboarding/components/OnboardingLoadingState.vue';
import OnboardingStepQueryGate from '@/components/Onboarding/components/OnboardingStepQueryGate.vue';
import { useOnboardingStepQueryState } from '@/components/Onboarding/composables/useOnboardingStepQueryState';
// --- Language Logic ---
import { GET_AVAILABLE_LANGUAGES_QUERY } from '@/components/Onboarding/graphql/availableLanguages.query';
import { GET_CORE_SETTINGS_QUERY } from '@/components/Onboarding/graphql/getCoreSettings.query';
import { TIME_ZONE_OPTIONS_QUERY } from '@/components/Onboarding/graphql/timeZoneOptions.query';
import { useOnboardingStore } from '@/components/Onboarding/store/onboardingStatus';
import { getTimeZones } from '@vvo/tzdb';

import type { OnboardingCoreSettingsDraft } from '@/components/Onboarding/onboardingWizardState';

export interface Props {
  initialDraft?: OnboardingCoreSettingsDraft | null;
  onComplete: (draft: OnboardingCoreSettingsDraft) => void | Promise<void>;
  onBack?: (draft: OnboardingCoreSettingsDraft) => void | Promise<void>;
  onCloseOnboarding?: () => void | Promise<void>;
  showBack?: boolean;
  isSavingStep?: boolean;
  saveError?: string | null;
}

const props = defineProps<Props>();
const { t } = useI18n();
const { completed: onboardingCompleted, loading: onboardingLoading } = storeToRefs(useOnboardingStore());

const TRUSTED_DEFAULT_PROFILE = Object.freeze({
  serverName: t('onboarding.coreSettings.defaultServerName'),
  serverDescription: '',
  timeZone: 'UTC',
  theme: 'white',
  locale: 'en_US',
  useSsh: false,
});

const resolveInitialTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || TRUSTED_DEFAULT_PROFILE.timeZone;
  } catch {
    return TRUSTED_DEFAULT_PROFILE.timeZone;
  }
};

const themeImages: Record<string, string> = {
  azure: azureThemeImg,
  black: blackThemeImg,
  gray: grayThemeImg,
  white: whiteThemeImg,
};

const selectedTimeZone = ref<string>(props.initialDraft?.timeZone ?? resolveInitialTimeZone());
const serverName = ref<string>(props.initialDraft?.serverName ?? TRUSTED_DEFAULT_PROFILE.serverName);
const serverDescription = ref<string>(
  props.initialDraft?.serverDescription ?? TRUSTED_DEFAULT_PROFILE.serverDescription
);
const selectedTheme = ref<string>(props.initialDraft?.theme ?? TRUSTED_DEFAULT_PROFILE.theme);
const selectedLanguage = ref<string>(props.initialDraft?.language ?? TRUSTED_DEFAULT_PROFILE.locale);
const useSsh = ref<boolean>(props.initialDraft?.useSsh ?? TRUSTED_DEFAULT_PROFILE.useSsh);
// ipAssignment removed
const currentIp = ref<string>('');
const localTld = ref<string>('local'); // Store localTld for hostname computation

const currentHostname = computed(() => {
  const name = serverName.value || t('onboarding.coreSettings.defaultServerName');
  const tld = localTld.value || 'local';
  return `${name.toLowerCase()}.${tld}`;
});

const isSaving = ref(false);
const error = ref<string | null>(null);

const {
  result: timeZoneOptionsResult,
  error: timeZoneOptionsError,
  refetch: refetchTimeZoneOptions,
} = useQuery(TIME_ZONE_OPTIONS_QUERY);
const {
  result: coreSettingsResult,
  error: coreSettingsQueryError,
  onResult: onCoreSettingsResult,
  refetch: refetchCoreSettings,
} = useQuery(GET_CORE_SETTINGS_QUERY, null, {
  fetchPolicy: 'network-only',
});

type CoreSettingsIdentityData = {
  server?: {
    name?: string | null;
    comment?: string | null;
  } | null;
  vars?: {
    name?: string | null;
  } | null;
  customization?: {
    activationCode?: {
      system?: {
        serverName?: string | null;
        comment?: string | null;
      } | null;
    } | null;
  } | null;
};

const applyPreferredIdentity = (data?: CoreSettingsIdentityData | null) => {
  if (props.initialDraft) {
    serverName.value = props.initialDraft.serverName ?? '';
    serverDescription.value = props.initialDraft.serverDescription ?? '';
    return;
  }

  const activationSystem = data?.customization?.activationCode?.system;
  const hasActivationSystem = activationSystem !== undefined && activationSystem !== null;
  const activationServerName = activationSystem?.serverName?.trim();
  const hasActivationComment =
    activationSystem?.comment !== undefined && activationSystem?.comment !== null;
  const activationComment = activationSystem?.comment ?? '';

  const apiServerName = data?.server?.name?.trim() || data?.vars?.name?.trim() || '';
  const apiServerComment = data?.server?.comment ?? '';

  // Wait for onboarding tracker state before deciding activation-vs-API precedence.
  if (onboardingLoading.value) {
    serverName.value = apiServerName || activationServerName || '';
    serverDescription.value = apiServerComment || (hasActivationComment ? activationComment : '');
    return;
  }

  const isInitialSetup = onboardingCompleted.value === false;
  if (isInitialSetup && hasActivationSystem) {
    serverName.value = activationServerName || apiServerName || '';
    // On first setup with activation metadata, keep description empty unless partner provided one.
    serverDescription.value = hasActivationComment ? activationComment : '';
    return;
  }

  serverName.value = apiServerName || activationServerName || '';
  serverDescription.value = apiServerComment || (hasActivationComment ? activationComment : '');
};

const applyPreferredTimeZone = (apiTimeZone?: string | null) => {
  if (props.initialDraft?.timeZone) {
    selectedTimeZone.value = props.initialDraft.timeZone;
    hasAutoSelected.value = true;
    return;
  }

  // Wait for onboarding tracker state before deciding browser-vs-API precedence.
  if (onboardingLoading.value) {
    return;
  }

  const normalizedApiTimeZone = apiTimeZone?.trim();
  const draftTimeZone = props.initialDraft?.timeZone?.trim();
  const isInitialSetup = onboardingCompleted.value === false;

  if (isInitialSetup) {
    if (draftTimeZone) {
      selectedTimeZone.value = draftTimeZone;
      hasAutoSelected.value = true;
      return;
    }

    const browserTimeZone = detectBrowserTimezone();
    if (browserTimeZone) {
      selectedTimeZone.value = browserTimeZone;
      hasAutoSelected.value = true;
      return;
    }

    if (normalizedApiTimeZone) {
      selectedTimeZone.value = normalizedApiTimeZone;
      hasAutoSelected.value = true;
    }

    return;
  }

  if (normalizedApiTimeZone) {
    selectedTimeZone.value = normalizedApiTimeZone;
    hasAutoSelected.value = true;
  }
};

onCoreSettingsResult((res) => {
  if (props.initialDraft) {
    serverName.value = props.initialDraft.serverName ?? serverName.value;
    serverDescription.value = props.initialDraft.serverDescription ?? serverDescription.value;
    selectedTimeZone.value = props.initialDraft.timeZone ?? selectedTimeZone.value;
    useSsh.value = props.initialDraft.useSsh ?? useSsh.value;
    selectedTheme.value = props.initialDraft.theme ?? selectedTheme.value;
    selectedLanguage.value = props.initialDraft.language ?? selectedLanguage.value;
    hasAutoSelected.value = true;
  } else {
    applyPreferredIdentity(res.data);
    applyPreferredTimeZone(res.data?.systemTime?.timeZone);
    if (res.data?.vars) {
      useSsh.value = res.data.vars.useSsh || false;
    }
    if (res.data?.display) {
      selectedTheme.value = res.data.display.theme || 'white';
      selectedLanguage.value = res.data.display.locale || 'en_US';
    }
  }

  if (res.data?.vars) {
    localTld.value = res.data.vars.localTld || 'local';
  }

  if (res.data?.info?.primaryNetwork) {
    currentIp.value = res.data.info.primaryNetwork.ipAddress || '';
  }
});

watch([onboardingLoading, onboardingCompleted], () => {
  if (!props.initialDraft) {
    applyPreferredIdentity(coreSettingsResult.value);
    applyPreferredTimeZone(coreSettingsResult.value?.systemTime?.timeZone);
  }
});

watch(
  () => props.initialDraft,
  (draft) => {
    if (!draft) {
      return;
    }

    serverName.value = draft.serverName ?? serverName.value;
    serverDescription.value = draft.serverDescription ?? serverDescription.value;
    selectedTimeZone.value = draft.timeZone ?? selectedTimeZone.value;
    selectedTheme.value = draft.theme ?? selectedTheme.value;
    selectedLanguage.value = draft.language ?? selectedLanguage.value;
    useSsh.value = draft.useSsh ?? useSsh.value;
  }
);

const tzdbTimeZones = getTimeZones();
const timeZoneOptions = computed(() => timeZoneOptionsResult.value?.timeZoneOptions ?? []);

interface TimeZoneOption {
  value: string;
  label: string;
}

const timeZoneItems = computed(() => {
  if (timeZoneOptions.value.length > 0) {
    return timeZoneOptions.value.map((tz: TimeZoneOption) => ({ value: tz.value, label: tz.label }));
  }

  return tzdbTimeZones.map((tz) => {
    const offsetMinutes = tz.currentTimeOffsetInMinutes;
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absMinutes = Math.abs(offsetMinutes);
    const hours = Math.floor(absMinutes / 60);
    const minutes = absMinutes % 60;
    const paddedMinutes = String(minutes).padStart(2, '0');
    const offsetStr = `UTC${sign}${hours}:${paddedMinutes}`;
    return {
      value: tz.name,
      label: `${tz.alternativeName} (${tz.name}) ${offsetStr}`,
    };
  });
});

const detectBrowserTimezone = (): string | null => {
  try {
    const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const exactMatch = tzdbTimeZones.find((tz) => tz.name === detectedTz);
    if (exactMatch) {
      return exactMatch.name;
    }

    const groupMatch = tzdbTimeZones.find((tz) => tz.group.includes(detectedTz));
    if (groupMatch) {
      return groupMatch.name;
    }

    return detectedTz;
  } catch (e) {
    console.warn('Failed to detect browser timezone:', e);
    return null;
  }
};

const hasAutoSelected = ref(false);

watch([selectedTimeZone, serverName, useSsh, serverDescription, selectedTheme, selectedLanguage], () => {
  if (error.value) {
    error.value = null;
  }
});

watch(
  timeZoneItems,
  (items) => {
    if (!items.length) return;
    if (hasAutoSelected.value) return;

    const available = new Set(items.map((item: { value: string }) => item.value));
    if (selectedTimeZone.value && !available.has(selectedTimeZone.value)) {
      selectedTimeZone.value = '';
    }

    if (!selectedTimeZone.value) {
      const detected = detectBrowserTimezone();
      if (detected && available.has(detected)) {
        selectedTimeZone.value = detected;
      }
      hasAutoSelected.value = true;
    }
  },
  { immediate: true }
);

// --- Theme Logic ---
const themeItems = computed(() => [
  { value: 'white', label: t('onboarding.coreSettings.themeOptions.white') },
  { value: 'black', label: t('onboarding.coreSettings.themeOptions.black') },
  { value: 'gray', label: t('onboarding.coreSettings.themeOptions.gray') },
  { value: 'azure', label: t('onboarding.coreSettings.themeOptions.azure') },
]);

const {
  result: languagesResult,
  loading: languagesLoading,
  error: languagesQueryError,
  refetch: refetchLanguages,
} = useQuery(GET_AVAILABLE_LANGUAGES_QUERY);

// Define interface for the language data
interface AvailableLanguage {
  code: string;
  name: string;
  url: string;
}

const languageItems = computed(() => {
  const languages = (languagesResult.value?.customization?.availableLanguages ||
    []) as AvailableLanguage[];

  const items: { value: string; label: string; url?: string }[] = languages.map((lang) => ({
    value: lang.code,
    label: lang.name,
    url: lang.url,
  }));

  // Ensure en_US is there if fetch failed or weird input
  if (!items.find((i) => i.value === 'en_US')) {
    items.unshift({ value: 'en_US', label: t('onboarding.coreSettings.englishLanguageLabel') });
  }
  return items;
});

const isLanguageDisabled = computed(() => languagesLoading.value || !!languagesQueryError.value);
const hasLoadedStepQueries = computed(
  () =>
    Boolean(timeZoneOptionsResult.value) &&
    Boolean(coreSettingsResult.value) &&
    Boolean(languagesResult.value)
);
const {
  isStepQueryLoading,
  retryQueries: handleRetryQueries,
  stepQueryError,
} = useOnboardingStepQueryState({
  errors: [timeZoneOptionsError, coreSettingsQueryError, languagesQueryError],
  ready: hasLoadedStepQueries,
  retry: () => Promise.all([refetchTimeZoneOptions(), refetchCoreSettings(), refetchLanguages()]),
});
const buildDraftSnapshot = (): OnboardingCoreSettingsDraft => ({
  serverName: serverName.value,
  serverDescription: serverDescription.value,
  timeZone: selectedTimeZone.value,
  theme: selectedTheme.value,
  language: selectedLanguage.value,
  useSsh: useSsh.value,
});

const handleSubmit = async () => {
  if (serverNameValidation.value || serverDescriptionValidation.value) {
    error.value = t('common.error');
    return;
  }

  isSaving.value = true;
  error.value = null;

  try {
    await props.onComplete(buildDraftSnapshot());
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : t('common.error');
  } finally {
    isSaving.value = false;
  }
};

const handleBack = async () => {
  await props.onBack?.(buildDraftSnapshot());
};

const serverNameValidation = computed(() => {
  // Basic check for empty if required, though API might handle it. UI usually requires it.
  if (!serverName.value) return t('onboarding.coreSettings.serverNameError.empty');
  if (serverName.value.length > 15) return t('onboarding.coreSettings.serverNameError.tooLong');
  // Invalid chars: anything not alphanumeric, dot, or dash
  if (/[^a-zA-Z0-9.-]/.test(serverName.value))
    return t('onboarding.coreSettings.serverNameError.invalidChars');
  // Invalid end: must not end with dot or dash
  if (/[.-]$/.test(serverName.value)) return t('onboarding.coreSettings.serverNameError.invalidEnd');
  return null;
});

const serverDescriptionValidation = computed(() => {
  if (serverDescription.value && serverDescription.value.length > 64) {
    return t('onboarding.coreSettings.serverDescriptionError.tooLong');
  }
  if (/["\\]/.test(serverDescription.value)) {
    return t('onboarding.coreSettings.serverDescriptionError.invalidChars');
  }
  return null;
});

const isBusy = computed(() => isSaving.value || (props.isSavingStep ?? false));
const stepError = computed(() => error.value ?? props.saveError ?? null);
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
            <Cog6ToothIcon class="text-primary h-8 w-8" />
            <h2 class="text-highlighted text-3xl font-extrabold tracking-tight uppercase">
              {{ t('onboarding.coreSettings.title') }}
            </h2>
          </div>
          <p class="text-muted text-lg">
            {{ t('onboarding.coreSettings.description') }}
          </p>
          <!-- Badge Container -->
          <div class="mt-2 flex flex-wrap gap-2">
            <!-- IP Address Badge -->
            <div
              v-if="currentIp"
              class="flex items-center gap-1 rounded border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-green-500" />
              {{ currentIp }}
            </div>
            <!-- Local Hostname Badge -->
            <div
              v-if="currentHostname"
              class="flex items-center gap-1 rounded border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <GlobeAltIcon class="text-primary h-3 w-3" />
              {{ currentHostname }}
            </div>
          </div>
        </div>
      </div>

      <OnboardingStepQueryGate
        :loading="isStepQueryLoading"
        :error="stepQueryError"
        :loading-description="t('onboarding.coreSettings.loadingDescription')"
        :on-retry="handleRetryQueries"
        :on-close-onboarding="props.onCloseOnboarding"
      >
        <!-- Top Grid: Server Identity & Region -->
        <div class="mb-8 grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
          <!-- Server Name -->
          <div class="flex flex-col gap-2">
            <label class="text-highlighted text-base font-bold">
              {{ t('onboarding.coreSettings.serverName') }}
            </label>
            <div class="space-y-1">
              <UInput
                v-model="serverName"
                :placeholder="t('onboarding.coreSettings.serverNamePlaceholder')"
                maxlength="15"
                :disabled="isBusy"
                size="lg"
                class="w-full"
                :class="{ '!border-red-500 focus:!border-red-500': !!serverNameValidation }"
              />
              <p v-if="serverNameValidation" class="text-sm font-medium text-red-500">
                {{ serverNameValidation }}
              </p>
            </div>
          </div>

          <!-- Server Description -->
          <div class="flex flex-col gap-2">
            <label class="text-highlighted text-base font-bold">
              {{ t('onboarding.coreSettings.serverDescription') }}
            </label>
            <div class="space-y-1">
              <UInput
                v-model="serverDescription"
                :placeholder="t('onboarding.coreSettings.serverDescriptionPlaceholder')"
                :disabled="isBusy"
                size="lg"
                class="w-full"
                :class="{ '!border-red-500 focus:!border-red-500': !!serverDescriptionValidation }"
              />
              <p v-if="serverDescriptionValidation" class="text-sm font-medium text-red-500">
                {{ serverDescriptionValidation }}
              </p>
            </div>
          </div>

          <!-- Time Zone -->
          <div class="flex flex-col gap-2">
            <label class="text-highlighted text-base font-bold">
              {{ t('onboarding.coreSettings.timezone') }}
            </label>
            <USelectMenu
              v-model="selectedTimeZone"
              :items="timeZoneItems"
              label-key="label"
              value-key="value"
              :search-input="false"
              :placeholder="t('onboarding.coreSettings.selectTimezonePlaceholder')"
              :disabled="isBusy"
              class="w-full"
              :ui="{ content: 'z-[100]' }"
            />
          </div>

          <!-- Language -->
          <div class="flex flex-col gap-2">
            <label class="text-highlighted text-base font-bold">
              {{ t('onboarding.coreSettings.language') }}
            </label>
            <USelectMenu
              v-model="selectedLanguage"
              :items="languageItems"
              label-key="label"
              value-key="value"
              :search-input="false"
              :placeholder="
                languagesLoading ? t('common.loading') : t('onboarding.coreSettings.selectLanguage')
              "
              :disabled="isBusy || isLanguageDisabled"
              class="w-full"
              :ui="{ content: 'z-[100]' }"
            />
          </div>
        </div>

        <div class="border-muted my-8 w-full border-t" />

        <!-- Bottom Section: Toggles & Theme -->
        <div class="space-y-8">
          <!-- SSH Access -->
          <div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div class="space-y-1">
              <h3 class="text-highlighted text-base font-bold">
                {{ t('onboarding.coreSettings.ssh') }}
              </h3>
              <p class="text-muted text-sm">
                {{ t('onboarding.coreSettings.sshDescription') }}
              </p>
            </div>
            <div class="flex items-center">
              <USwitch :model-value="useSsh" :disabled="isBusy" @update:model-value="useSsh = $event" />
            </div>
          </div>
          <!-- Border -->
          <div class="border-muted my-8 w-full border-t" />

          <!-- Theme Selection -->
          <div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div class="space-y-1">
              <h3 class="text-highlighted text-base font-bold">
                {{ t('onboarding.coreSettings.theme') }}
              </h3>
              <p class="text-muted text-sm">
                {{ t('onboarding.coreSettings.themeDescription') }}
              </p>
            </div>
            <div class="w-full md:w-64">
              <USelectMenu
                v-model="selectedTheme"
                :items="themeItems"
                label-key="label"
                value-key="value"
                :search-input="false"
                :disabled="isBusy"
                class="w-full"
                :ui="{ content: 'z-[100]' }"
              />
            </div>
          </div>

          <!-- Theme Preview Image -->
          <div
            class="min-h-[200px] w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-800"
          >
            <img
              :src="themeImages[selectedTheme] || themeImages['white']"
              :alt="t('onboarding.coreSettings.themePreviewAlt', { theme: selectedTheme })"
              class="h-auto w-full object-cover"
            />
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-if="stepError"
          class="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10"
        >
          <p class="text-center text-sm font-medium text-red-600 dark:text-red-400">
            {{ stepError }}
          </p>
        </div>

        <!-- Footer -->
        <div
          class="border-muted mt-8 flex flex-col-reverse items-center justify-between gap-6 border-t pt-8 sm:flex-row"
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

          <BrandButton
            :text="t('onboarding.coreSettings.next')"
            class="!bg-primary hover:!bg-primary/90 w-full min-w-[160px] !text-white shadow-md transition-all hover:shadow-lg sm:w-auto"
            :disabled="isBusy || !!serverNameValidation || !!serverDescriptionValidation"
            :loading="isBusy"
            @click="handleSubmit"
            :icon-right="ChevronRightIcon"
          />
        </div>
      </OnboardingStepQueryGate>
    </div>
  </div>
</template>
