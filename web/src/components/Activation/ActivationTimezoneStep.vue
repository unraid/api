<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';

import { BrandButton, Select } from '@unraid/ui';
import { UPDATE_SYSTEM_TIME_MUTATION } from '@/components/Activation/updateSystemTime.mutation';
import { getTimeZones } from '@vvo/tzdb';

import type { ComposerTranslation } from 'vue-i18n';

export interface Props {
  t: ComposerTranslation;
  onComplete: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
}

const props = defineProps<Props>();

const selectedTimeZone = ref<string>('');
const isSaving = ref(false);
const error = ref<string | null>(null);

const { mutate: updateSystemTime } = useMutation(UPDATE_SYSTEM_TIME_MUTATION);

const timeZones = getTimeZones();

const timeZoneItems = computed(() => {
  return timeZones.map((tz) => {
    const offset = tz.currentTimeOffsetInMinutes / 60;
    const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`;
    return {
      value: tz.name,
      label: `${tz.alternativeName} (${tz.name}) UTC${offsetStr}`,
    };
  });
});

const detectBrowserTimezone = (): string | null => {
  try {
    const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const exactMatch = timeZones.find((tz) => tz.name === detectedTz);
    if (exactMatch) {
      return exactMatch.name;
    }

    const groupMatch = timeZones.find((tz) => tz.group.includes(detectedTz));
    if (groupMatch) {
      return groupMatch.name;
    }

    return detectedTz;
  } catch (e) {
    console.warn('Failed to detect browser timezone:', e);
    return null;
  }
};

onMounted(() => {
  const detected = detectBrowserTimezone();
  if (detected) {
    selectedTimeZone.value = detected;
  }
});

const handleSubmit = async () => {
  if (!selectedTimeZone.value) {
    error.value = props.t('Please select a timezone');
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
    error.value = props.t('Failed to update timezone. Please try again.');
    console.error('Failed to update timezone:', err);
  } finally {
    isSaving.value = false;
  }
};

const handleSkip = () => {
  props.onSkip?.();
};
</script>

<template>
  <div class="mx-auto flex w-full max-w-md flex-col items-center justify-center">
    <h2 class="mb-4 text-xl font-semibold">{{ t('Set Your Time Zone') }}</h2>
    <p class="mb-6 text-center text-sm opacity-75">
      {{ t('Select your time zone to ensure accurate timestamps throughout the system.') }}
    </p>

    <div class="mb-6 w-full">
      <Select
        v-model="selectedTimeZone"
        :items="timeZoneItems"
        :placeholder="t('Select a timezone')"
        class="w-full"
      />
    </div>

    <div v-if="error" class="mb-4 text-sm text-red-500">
      {{ error }}
    </div>

    <div class="flex gap-4">
      <BrandButton
        v-if="onSkip && showSkip"
        :text="t('Skip')"
        variant="outline"
        :disabled="isSaving"
        @click="handleSkip"
      />
      <BrandButton
        :text="t('Continue')"
        :disabled="!selectedTimeZone || isSaving"
        :loading="isSaving"
        @click="handleSubmit"
      />
    </div>
  </div>
</template>
