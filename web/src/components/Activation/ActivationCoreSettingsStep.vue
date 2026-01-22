<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMutation, useQuery } from '@vue/apollo-composable';

import { ChevronLeftIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline';
import { ChevronRightIcon } from '@heroicons/vue/24/solid';
import { BrandButton, Select } from '@unraid/ui';
import { GET_CORE_SETTINGS_QUERY } from '@/components/Activation/getCoreSettings.query';
import { TIME_ZONE_OPTIONS_QUERY } from '@/components/Activation/timeZoneOptions.query';
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

const selectedTimeZone = ref<string>('');
const serverName = ref<string>('');
const useSsh = ref<boolean>(false);
const ipAssignment = ref<string>('dhcp'); // Mock for UI
const isSaving = ref(false);
const error = ref<string | null>(null);

const { mutate: updateSystemTime } = useMutation(UPDATE_SYSTEM_TIME_MUTATION);
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
  if (res.data?.vars) {
    serverName.value = res.data.vars.name || '';
    useSsh.value = res.data.vars.useSsh || false;
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

watch([selectedTimeZone, serverName, useSsh], () => {
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

    // Server Name and SSH are currently read-only in this step as API support is pending.

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

// Mock items for IP Assignment
const ipItems = [
  { label: 'DHCP', value: 'dhcp' },
  { label: 'Static', value: 'static', disabled: true },
];
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4 pb-4 md:px-8">
    <div class="bg-elevated border-muted rounded-xl border p-6 text-left shadow-sm md:p-10">
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
        </div>
      </div>

      <!-- Main Form Grid -->
      <div class="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        <!-- Server Name -->
        <div class="flex flex-col gap-3">
          <label class="text-highlighted text-base font-bold">
            {{ t('activation.coreSettings.serverName') }}
          </label>
          <div class="space-y-1">
            <UInput
              v-model="serverName"
              placeholder="Tower"
              disabled
              size="lg"
              class="w-full cursor-not-allowed opacity-75"
              :class="{ '!border-red-500 focus:!border-red-500': !!serverNameValidation }"
            />
            <p v-if="serverNameValidation" class="text-sm font-medium text-red-500">
              {{ serverNameValidation }}
            </p>
          </div>
        </div>

        <!-- Time Zone -->
        <div class="flex flex-col gap-3">
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
      </div>

      <!-- Divider -->
      <div class="border-muted my-8 w-full border-t" />

      <!-- Settings List -->
      <div class="space-y-8">
        <!-- IP Assignment -->
        <div class="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div class="space-y-1">
            <h3 class="text-highlighted text-base font-bold">
              {{ t('activation.coreSettings.ipAddress') }}
            </h3>
            <p class="text-muted text-sm">Automatic (DHCP) is recommended for most users.</p>
          </div>
          <div class="w-full md:w-64">
            <Select
              v-model="ipAssignment"
              :items="ipItems"
              disabled
              class="w-full opacity-75"
              size="lg"
            />
          </div>
        </div>

        <!-- SSH Access -->
        <div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div class="space-y-1">
            <h3 class="text-highlighted text-base font-bold">{{ t('activation.coreSettings.ssh') }}</h3>
            <p class="text-muted text-sm">Allow command line access via port 22.</p>
          </div>
          <div class="flex items-center">
            <!-- Custom Switch Implementation using Headless UI to match Theme -->
            <Switch
              v-model="useSsh"
              disabled
              :class="[
                useSsh ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700',
                'focus:ring-primary relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent opacity-50 transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-offset-2 focus:outline-none',
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
</template>
