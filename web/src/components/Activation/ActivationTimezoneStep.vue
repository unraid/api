<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMutation } from '@vue/apollo-composable';

import { BrandButton, Select } from '@unraid/ui';
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

watch(selectedTimeZone, () => {
  if (error.value) {
    error.value = null;
  }
});

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
