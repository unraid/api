<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMutation, useQuery } from '@vue/apollo-composable';

import { ChevronLeftIcon, Cog6ToothIcon, GlobeAltIcon } from '@heroicons/vue/24/outline';
import { ChevronRightIcon } from '@heroicons/vue/24/solid';
import { BrandButton, Select } from '@unraid/ui';
// --- Theme Images ---
import azureThemeImg from '@/assets/unraid-azure-theme.png';
import blackThemeImg from '@/assets/unraid-black-theme.png';
import grayThemeImg from '@/assets/unraid-gray-theme.png';
import whiteThemeImg from '@/assets/unraid-white-theme.png';
// --- Language Logic ---
import { GET_AVAILABLE_LANGUAGES_QUERY } from '@/components/Activation/availableLanguages.query';
import {
  INSTALL_LANGUAGE_MUTATION,
  SET_LOCALE_MUTATION,
  SET_THEME_MUTATION,
  UPDATE_SERVER_IDENTITY_MUTATION,
  UPDATE_SSH_SETTINGS_MUTATION,
} from '@/components/Activation/coreSettings.mutations';
import { GET_CORE_SETTINGS_QUERY } from '@/components/Activation/getCoreSettings.query';
import { TIME_ZONE_OPTIONS_QUERY } from '@/components/Activation/timeZoneOptions.query';
import TypographyCloud from '@/components/Activation/TypographyCloud.vue';
import { UPDATE_SYSTEM_TIME_MUTATION } from '@/components/Activation/updateSystemTime.mutation';
import { Switch } from '@headlessui/vue';
import { getTimeZones } from '@vvo/tzdb';

export interface Props {
  onComplete: () => void;
  onBack?: () => void;
  showBack?: boolean;
  isSavingStep?: boolean;
}

const props = defineProps<Props>();
const { t } = useI18n();

const themeImages: Record<string, string> = {
  azure: azureThemeImg,
  black: blackThemeImg,
  gray: grayThemeImg,
  white: whiteThemeImg,
};

// ... inside script setup ...

const selectedTimeZone = ref<string>('');
const serverName = ref<string>('');
const serverDescription = ref<string>('');
const selectedTheme = ref<string>('');
const selectedLanguage = ref<string>('');
const useSsh = ref<boolean>(false);
// ipAssignment removed
const currentIp = ref<string>('');
const localTld = ref<string>('local'); // Store localTld for hostname computation

const currentHostname = computed(() => {
  const name = serverName.value || 'Tower';
  const tld = localTld.value || 'local';
  return `${name.toLowerCase()}.${tld}`;
});

const isSaving = ref(false);
const error = ref<string | null>(null);

const { mutate: updateSystemTime } = useMutation(UPDATE_SYSTEM_TIME_MUTATION);
const { mutate: updateServerIdentity } = useMutation(UPDATE_SERVER_IDENTITY_MUTATION); // Added
const { mutate: setTheme } = useMutation(SET_THEME_MUTATION); // Added
const { mutate: setLocale } = useMutation(SET_LOCALE_MUTATION); // Added
const { mutate: installLanguage } = useMutation(INSTALL_LANGUAGE_MUTATION); // Added
const { mutate: updateSshSettings } = useMutation(UPDATE_SSH_SETTINGS_MUTATION); // Added

const { result: timeZoneOptionsResult } = useQuery(TIME_ZONE_OPTIONS_QUERY);
const { result: coreSettingsResult, onResult: onCoreSettingsResult } = useQuery(
  GET_CORE_SETTINGS_QUERY,
  null,
  {
    fetchPolicy: 'network-only',
  }
);

onCoreSettingsResult((res) => {
  if (res.data?.systemTime?.timeZone) {
    selectedTimeZone.value = res.data.systemTime.timeZone;
    hasAutoSelected.value = true;
  }
  // Fallback to vars if server not fully populated, but server should take precedence
  if (res.data?.server) {
    serverName.value = res.data.server.name || res.data.vars?.name || '';
    serverDescription.value = res.data.server.comment || '';
  } else if (res.data?.vars) {
    serverName.value = res.data.vars.name || '';
  }

  if (res.data?.vars) {
    useSsh.value = res.data.vars.useSsh || false;
  }

  if (res.data?.display) {
    selectedTheme.value = res.data.display.theme || 'white';
    selectedLanguage.value = res.data.display.locale || 'en_US';
  }

  if (res.data?.vars) {
    localTld.value = res.data.vars.localTld || 'local';
  }

  if (res.data?.info?.primaryNetwork) {
    currentIp.value = res.data.info.primaryNetwork.ipAddress || '';
  }
});

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

    const available = new Set(items.map((item) => item.value));
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
const themeItems = [
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
  { value: 'gray', label: 'Gray' },
  { value: 'azure', label: 'Azure' },
];

const {
  result: languagesResult,
  loading: isLanguagesLoading,
  error: languagesQueryError,
} = useQuery(GET_AVAILABLE_LANGUAGES_QUERY);

// Define interface for the language data
interface AvailableLanguage {
  code: string;
  name: string;
  url: string;
}

const languageItems = computed(() => {
  const languages = (languagesResult.value?.availableLanguages || []) as AvailableLanguage[];

  const items: { value: string; label: string; url?: string }[] = languages.map((lang) => ({
    value: lang.code,
    label: lang.name,
    url: lang.url,
  }));

  // Ensure en_US is there if fetch failed or weird input
  if (!items.find((i) => i.value === 'en_US')) {
    items.unshift({ value: 'en_US', label: 'English' });
  }
  return items;
});

const isLanguageDisabled = computed(() => isLanguagesLoading.value || !!languagesQueryError.value);

// --- Submit Logic ---

const handleSubmit = async () => {
  isSaving.value = true;
  error.value = null;

  try {
    const promises = [];

    // Update Timezone
    if (
      selectedTimeZone.value &&
      selectedTimeZone.value !== coreSettingsResult.value?.systemTime?.timeZone
    ) {
      promises.push(updateSystemTime({ input: { timeZone: selectedTimeZone.value } }));
    }

    // Update Server Identity
    const originalName = coreSettingsResult.value?.server?.name || coreSettingsResult.value?.vars?.name;
    const originalComment = coreSettingsResult.value?.server?.comment;

    if (
      (serverName.value && serverName.value !== originalName) ||
      (serverDescription.value !== undefined && serverDescription.value !== originalComment)
    ) {
      promises.push(
        updateServerIdentity({
          name: serverName.value,
          comment: serverDescription.value,
        })
      );
    }

    // Update Theme
    if (selectedTheme.value && selectedTheme.value !== coreSettingsResult.value?.display?.theme) {
      promises.push(setTheme({ theme: selectedTheme.value }));
    }

    // Update Language
    if (selectedLanguage.value && selectedLanguage.value !== coreSettingsResult.value?.display?.locale) {
      // Logic: Install language first if not en_US and assuming not installed (or just re-install to be safe/simple)
      // Then set locale.
      const langFlow = async () => {
        if (selectedLanguage.value !== 'en_US') {
          const selectedItem = languageItems.value.find((i) => i.value === selectedLanguage.value);
          if (selectedItem?.url) {
            // Install Language
            await installLanguage({
              input: {
                url: selectedItem.url,
                name: `Language Pack: ${selectedLanguage.value}`,
              },
            });
          }
        }
        // Set Locale
        await setLocale({ locale: selectedLanguage.value });
      };
      promises.push(langFlow());
    }

    // Update SSH
    if (useSsh.value !== coreSettingsResult.value?.vars?.useSsh) {
      // Default port 22 if not specified. The UI doesn't have a port input yet, so we assume default or current
      const currentPort = coreSettingsResult.value?.vars?.portssh || 22;
      promises.push(updateSshSettings({ enabled: useSsh.value, port: currentPort }));
    }

    await Promise.all(promises);
    props.onComplete();
  } catch (err: unknown) {
    console.warn('Failed to update settings:', err);
    error.value = err instanceof Error ? err.message : t('common.error');
  } finally {
    isSaving.value = false;
  }
};

const handleBack = () => {
  props.onBack?.();
};

const serverNameValidation = computed(() => {
  // Basic check for empty if required, though API might handle it. UI usually requires it.
  if (!serverName.value) return t('activation.coreSettings.serverNameError.empty');
  // Invalid chars: anything not alphanumeric, dot, or dash
  if (/[^a-zA-Z0-9.-]/.test(serverName.value))
    return t('activation.coreSettings.serverNameError.invalidChars');
  // Invalid end: must not end with dot or dash
  if (/[.-]$/.test(serverName.value)) return t('activation.coreSettings.serverNameError.invalidEnd');
  return null;
});

const isBusy = computed(() => isSaving.value || (props.isSavingStep ?? false));
</script>

<template>
  <!-- Main Step Container with Relative Positioning -->
  <div class="relative w-full">
    <!-- Typography Cloud Background -->
    <div class="pointer-events-none fixed inset-0 -z-10 hidden overflow-hidden md:block">
      <TypographyCloud />
    </div>

    <!-- Content Card -->
    <div class="relative z-10 mx-auto w-full max-w-4xl px-4 pb-4 md:px-8">
      <div
        class="bg-elevated border-muted bg-opacity-95 rounded-xl border p-6 text-left shadow-sm backdrop-blur-sm md:p-10"
      >
        <!-- Header -->
        <div class="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <Cog6ToothIcon class="text-primary h-8 w-8" />
              <h2 class="text-highlighted text-3xl font-extrabold tracking-tight uppercase">
                {{ t('activation.coreSettings.title') }}
              </h2>
            </div>
            <p class="text-muted text-lg">
              {{ t('activation.coreSettings.description') }}
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

        <!-- Main Form Content -->

        <!-- Top Grid: Server Identity & Region -->
        <div class="mb-8 grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
          <!-- Server Name -->
          <div class="flex flex-col gap-2">
            <label class="text-highlighted text-base font-bold">
              {{ t('activation.coreSettings.serverName') }}
            </label>
            <div class="space-y-1">
              <UInput
                v-model="serverName"
                placeholder="Tower"
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
              {{ t('activation.coreSettings.serverDescription') }}
            </label>
            <UInput
              v-model="serverDescription"
              :placeholder="t('activation.coreSettings.serverDescriptionPlaceholder')"
              :disabled="isBusy"
              size="lg"
              class="w-full"
            />
          </div>

          <!-- Time Zone -->
          <div class="flex flex-col gap-2">
            <label class="text-highlighted text-base font-bold">
              {{ t('activation.timezoneStep.setYourTimeZone') }}
            </label>
            <Select
              v-model="selectedTimeZone"
              :items="timeZoneItems"
              :placeholder="t('activation.timezoneStep.selectTimezonePlaceholder')"
              class="w-full"
              :disabled="isBusy"
              size="lg"
            />
          </div>

          <!-- Language -->
          <div class="flex flex-col gap-2">
            <label class="text-highlighted text-base font-bold">
              {{ t('activation.coreSettings.language') }}
            </label>
            <Select
              v-model="selectedLanguage"
              :items="languageItems"
              :placeholder="
                isLanguagesLoading ? t('common.loading') : t('activation.coreSettings.selectLanguage')
              "
              class="w-full"
              :disabled="isBusy || isLanguageDisabled"
              size="lg"
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
                {{ t('activation.coreSettings.ssh') }}
              </h3>
              <p class="text-muted text-sm">
                {{ t('activation.coreSettings.sshDescription') }}
              </p>
            </div>
            <div class="flex items-center">
              <Switch
                v-model="useSsh"
                :disabled="isBusy"
                :class="[
                  useSsh ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700',
                  isBusy ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                  'focus:ring-primary relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-offset-2 focus:outline-none',
                ]"
              >
                <span class="sr-only">{{ t('activation.coreSettings.ssh') }}</span>
                <span
                  aria-hidden="true"
                  :class="[
                    useSsh ? 'translate-x-5' : 'translate-x-0',
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  ]"
                />
              </Switch>
            </div>
          </div>
          <!-- Border -->
          <div class="border-muted my-8 w-full border-t" />

          <!-- Theme Selection -->
          <div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div class="space-y-1">
              <h3 class="text-highlighted text-base font-bold">
                {{ t('activation.coreSettings.theme') }}
              </h3>
              <p class="text-muted text-sm">
                {{ t('activation.coreSettings.themeDescription') }}
              </p>
            </div>
            <div class="w-full md:w-64">
              <Select
                v-model="selectedTheme"
                :items="themeItems"
                class="w-full"
                :disabled="isBusy"
                size="lg"
              />
            </div>
          </div>

          <!-- Theme Preview Image -->
          <div
            class="min-h-[200px] w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-800"
          >
            <img
              :src="themeImages[selectedTheme] || themeImages['white']"
              :alt="selectedTheme + ' theme preview'"
              class="h-auto w-full object-cover"
            />
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10"
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
            class="text-muted hover:text-toned group flex w-full items-center justify-center gap-2 font-medium transition-colors sm:w-auto sm:justify-start"
            :disabled="isBusy"
          >
            <ChevronLeftIcon class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
            {{ t('common.back') }}
          </button>
          <div v-else class="hidden w-1 sm:block" />

          <BrandButton
            :text="t('activation.coreSettings.next')"
            class="!bg-primary hover:!bg-primary/90 w-full min-w-[160px] !text-white shadow-md transition-all hover:shadow-lg sm:w-auto"
            :disabled="isBusy || !!serverNameValidation"
            :loading="isBusy"
            @click="handleSubmit"
            :icon-right="ChevronRightIcon"
          />
        </div>
      </div>
    </div>
  </div>
</template>
