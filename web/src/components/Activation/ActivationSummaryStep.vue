<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import { BrandButton } from '@unraid/ui';
import gql from 'graphql-tag';

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

// Fetch installed plugins to summarize
const { result: pluginsResult } = useQuery(INSTALLED_UNRAID_PLUGINS_QUERY, null, {
  fetchPolicy: 'cache-and-network',
});

const installedPluginsCount = computed(() => {
  return pluginsResult.value?.installedUnraidPlugins?.length ?? 0;
});

// Attempt to fetch System Time to show timezone (assuming systemTime query exists or we fallback)
const SYSTEM_TIME_QUERY = gql`
  query SystemTime {
    systemTime {
      timeZone
    }
  }
`;
const { result: systemTimeResult } = useQuery(SYSTEM_TIME_QUERY);

const currentTimeZone = computed(() => {
  return systemTimeResult.value?.systemTime?.timeZone || 'Time zone configured';
});

const activationStatusLabel = computed(() => {
  // Basic mapping based on store state - adjust as needed
  if (registrationState.value === 'ENOKEYFILE') return 'Trial Ready'; // Or 'Unregistered'
  return 'Activated';
});

const handleComplete = () => {
  props.onComplete();
};
</script>

<template>
  <div class="mx-auto flex w-full max-w-xl flex-col items-center space-y-6">
    <div class="mb-4 text-center">
      <h1 class="text-2xl font-semibold">{{ t('activation.summaryStep.title') }}</h1>
      <p class="mt-2 text-sm opacity-75">{{ t('activation.summaryStep.description') }}</p>
    </div>

    <div class="bg-card border-border w-full space-y-4 rounded-lg border p-6">
      <!-- Timezone -->
      <div class="border-border flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-clock" class="text-primary-500 h-5 w-5" />
          <span class="font-medium">{{ t('activation.timezoneStep.setYourTimeZone') }}</span>
        </div>
        <div class="text-muted-foreground text-sm">{{ currentTimeZone }}</div>
      </div>

      <!-- Plugins -->
      <div class="border-border flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-puzzle-piece" class="text-primary-500 h-5 w-5" />
          <span class="font-medium">Plugins</span>
        </div>
        <div class="text-muted-foreground text-sm">{{ installedPluginsCount }} installed</div>
      </div>

      <!-- Activation -->
      <div class="border-border flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-key" class="text-primary-500 h-5 w-5" />
          <span class="font-medium">Activation</span>
        </div>
        <div class="text-muted-foreground text-sm">{{ activationStatusLabel }}</div>
      </div>
    </div>

    <div class="flex space-x-4 pt-4">
      <BrandButton v-if="showBack" :text="t('common.back')" variant="outline" @click="onBack" />
      <BrandButton :text="t('common.continue')" @click="handleComplete" />
    </div>
  </div>
</template>
