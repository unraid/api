<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery } from '@vue/apollo-composable';

import { ARRAY_CAPACITY_QUERY } from '~/components/Header/arrayCapacity.query';

/**
 * Array space-usage bar for the consolidated header. Replaces the legacy
 * webgui `my_usage()` widget that was jQuery-injected into `#array-usage-sidenav`
 * for sidebar themes. Driven by the GraphQL `array.capacity` field so it stays
 * self-contained within the header web component.
 */
const { t } = useI18n();

// Match the legacy `usage_color()` thresholds (utilization %). The webgui allows
// per-array overrides via display settings; those are not exposed over GraphQL yet,
// so fall back to Unraid's default warning/critical utilization levels.
const WARNING_PERCENT = 70;
const CRITICAL_PERCENT = 90;

const { result } = useQuery(ARRAY_CAPACITY_QUERY, null, {
  pollInterval: 30_000,
  fetchPolicy: 'cache-and-network',
});

const array = computed(() => result.value?.array);
const started = computed(() => array.value?.state === 'STARTED');

const usedPercent = computed(() => {
  const total = Number(array.value?.capacity?.kilobytes?.total ?? 0);
  const free = Number(array.value?.capacity?.kilobytes?.free ?? 0);
  if (!total || Number.isNaN(total) || Number.isNaN(free)) return 0;
  return Math.min(100, Math.max(0, 100 - Math.round((100 * free) / total)));
});

const barColorClass = computed(() => {
  if (usedPercent.value >= CRITICAL_PERCENT) return 'bg-unraid-red';
  if (usedPercent.value >= WARNING_PERCENT) return 'bg-orange-dark';
  return 'bg-unraid-green';
});

// Only render once the array field has resolved to avoid a flash of an empty bar.
const hasData = computed(() => array.value != null);
</script>

<template>
  <div
    v-if="hasData"
    class="flex w-full flex-col gap-y-0.5 sm:w-40"
    :title="started ? t('headerArrayUsage.usedOfArray', [usedPercent]) : undefined"
  >
    <div class="text-header-text-secondary flex items-center justify-between text-xs leading-none">
      <span>{{ t('headerArrayUsage.array') }}</span>
      <span v-if="started" class="font-semibold">{{ usedPercent }}%</span>
    </div>
    <div class="bg-header-text-secondary/20 h-1.5 w-full overflow-hidden rounded-full">
      <div
        v-if="started"
        class="h-full rounded-full transition-[width]"
        :class="barColorClass"
        :style="{ width: `${usedPercent}%` }"
      />
    </div>
    <span v-if="!started" class="text-header-text-secondary text-xs leading-none">
      {{ t('headerArrayUsage.offline') }}
    </span>
  </div>
</template>
