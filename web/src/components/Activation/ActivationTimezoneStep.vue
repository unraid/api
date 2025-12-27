<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMutation, useQuery } from '@vue/apollo-composable';

import { BrandButton, Select } from '@unraid/ui';
import { TIME_ZONE_OPTIONS_QUERY } from '@/components/Activation/timeZoneOptions.query';
import { UPDATE_SYSTEM_TIME_MUTATION } from '@/components/Activation/updateSystemTime.mutation';
import { getTimeZones } from '@vvo/tzdb';

export interface Props {
  onComplete: () => void;
  onSkip?: () => void;
  onBack?: () => void;
  showSkip?: boolean;
  showBack?: boolean;
}

const props = defineProps<Props>();
const { t } = useI18n();

const selectedTimeZone = ref<string>('');
const isSaving = ref(false);
const error = ref<string | null>(null);

const { mutate: updateSystemTime } = useMutation(UPDATE_SYSTEM_TIME_MUTATION);
const { result: timeZoneOptionsResult } = useQuery(TIME_ZONE_OPTIONS_QUERY);

const tzdbTimeZones = getTimeZones();
const timeZoneOptions = computed(() => timeZoneOptionsResult.value?.timeZoneOptions ?? []);

const timeZoneItems = computed(() => {
  if (timeZoneOptions.value.length > 0) {
    return timeZoneOptions.value.map((tz) => ({ value: tz.value, label: tz.label }));
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

watch(selectedTimeZone, () => {
  if (error.value) {
    error.value = null;
  }
});

watch(
  timeZoneItems,
  (items) => {
    if (!items.length) return;

    const available = new Set(items.map((item) => item.value));
    if (selectedTimeZone.value && !available.has(selectedTimeZone.value)) {
      selectedTimeZone.value = '';
    }

    if (!hasAutoSelected.value || !selectedTimeZone.value) {
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
  if (!selectedTimeZone.value) {
    error.value = t('activation.timezoneStep.selectTimezoneError');
    return;
  }

  if (error.value) {
    props.onComplete();
    return;
  }

  isSaving.value = true;
  error.value = null;

  try {
    await updateSystemTime({
      input: {
        timeZone: selectedTimeZone.value,
      },
    });
    props.onComplete();
  } catch (err) {
    console.warn('Failed to update timezone:', err);
    error.value = err instanceof Error ? err.message : t('common.error');
  } finally {
    isSaving.value = false;
  }
};

const handleSkip = () => {
  props.onSkip?.();
};

const handleBack = () => {
  props.onBack?.();
};
</script>

<template>
  <div class="mx-auto flex w-full max-w-md flex-col items-center justify-center">
    <h2 class="mb-4 text-xl font-semibold">{{ t('activation.timezoneStep.setYourTimeZone') }}</h2>
    <p class="mb-6 text-center text-sm opacity-75">
      {{ t('activation.timezoneStep.selectTimezoneDescription') }}
    </p>

    <div class="mb-6 w-full">
      <Select
        v-model="selectedTimeZone"
        :items="timeZoneItems"
        :placeholder="t('activation.timezoneStep.selectTimezonePlaceholder')"
        class="w-full"
      />
    </div>

    <div v-if="error" class="mb-4 text-sm text-red-500">
      {{ error }}
    </div>

    <div class="flex gap-4">
      <BrandButton
        v-if="onBack && showBack"
        :text="t('common.back')"
        variant="outline"
        :disabled="isSaving"
        @click="handleBack"
      />
      <div class="flex-1" />
      <BrandButton
        v-if="onSkip && showSkip"
        :text="t('common.skip')"
        variant="outline"
        :disabled="isSaving"
        @click="handleSkip"
      />
      <BrandButton
        :text="t('common.continue')"
        :disabled="!selectedTimeZone || isSaving"
        :loading="isSaving"
        @click="handleSubmit"
      />
    </div>
  </div>
</template>
