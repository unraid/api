<script setup lang="ts">
import { CircleStackIcon } from '@heroicons/vue/24/outline';

import type { BootConfigurationSummaryViewModel } from '@/components/Onboarding/components/bootConfigurationSummary/buildBootConfigurationSummaryViewModel';

defineProps<{
  summary: BootConfigurationSummaryViewModel;
}>();
</script>

<template>
  <div data-testid="boot-configuration-summary" class="border-muted bg-bg/50 rounded-lg border p-5">
    <div class="mb-4 flex items-center gap-2">
      <CircleStackIcon class="text-primary h-5 w-5" />
      <h3 class="text-highlighted text-sm font-bold tracking-wider uppercase">
        {{ summary.title }}
      </h3>
    </div>

    <div class="space-y-3">
      <div
        v-for="row in summary.rows"
        :key="row.key"
        class="flex flex-col gap-1 text-sm sm:flex-row sm:items-start sm:justify-between"
      >
        <span class="text-muted">{{ row.label }}</span>
        <span class="text-highlighted font-medium break-all sm:text-right">{{ row.value }}</span>
      </div>

      <div
        v-if="summary.devices.length > 0"
        class="flex flex-col gap-1 text-sm sm:flex-row sm:items-start sm:justify-between"
      >
        <span class="text-muted">{{ summary.devicesLabel }}</span>
        <div class="flex flex-wrap gap-2 sm:justify-end">
          <span
            v-for="device in summary.devices"
            :key="device.id"
            class="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold break-all"
          >
            {{ device.label }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
