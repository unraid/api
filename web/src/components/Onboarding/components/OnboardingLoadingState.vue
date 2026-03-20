<script setup lang="ts">
import { Spinner as LoadingSpinner } from '@unraid/ui';

const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    compact?: boolean;
  }>(),
  {
    title: '',
    description: '',
    compact: false,
  }
);
</script>

<template>
  <div
    data-testid="onboarding-loading-state"
    :class="[
      'border-muted bg-elevated/95 flex w-full flex-col items-center justify-center rounded-2xl border text-center shadow-sm backdrop-blur-sm',
      compact ? 'min-h-[180px] px-6 py-10' : 'min-h-[320px] px-8 py-14',
    ]"
    role="status"
    aria-live="polite"
  >
    <LoadingSpinner class="text-primary h-10 w-10" />
    <div class="mt-5 space-y-2">
      <h3 v-if="title" class="text-highlighted text-lg font-semibold">
        {{ title }}
      </h3>
      <p v-if="description" class="text-muted mx-auto max-w-xl text-sm leading-6">
        {{ description }}
      </p>
    </div>
  </div>
</template>
