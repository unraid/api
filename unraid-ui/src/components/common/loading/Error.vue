<script setup lang="ts">
import Button from '@/components/common/button/Button.vue';
import LoadingSpinner from '@/components/common/loading/Spinner.vue';
import { cn } from '@/lib/utils';
import { ShieldExclamationIcon } from '@heroicons/vue/24/solid';

/**
 * A default container for displaying loading and error states.
 *
 * By default, this component will expand to full height and display contents
 * in the center of the container.
 *
 * Any slot/child will only render when a loading/error state isn't displayed.
 *
 * Exposes a 'retry' event (user-triggered during error state).
 *
 * @example
 * <LoadingError @retry="retryFunction" :loading="loading" :error="error" />
 *
 * <LoadingError :loading="loading" :error="error">
 *     <p>Only displayed when both loading and error are false.</p>
 * </LoadingError>
 */
const props = withDefaults(
  defineProps<{
    class?: string;
    /** hasdfsa */
    loading: boolean;
    error: Error | null | undefined;
  }>(),
  { class: '' }
);

defineEmits(['retry']);
</script>
<template>
  <div :class="cn('flex h-full flex-col items-center justify-center gap-3', props.class)">
    <!-- Loading State -->
    <div v-if="loading" class="contents">
      <LoadingSpinner />
      <p>Loading Notifications...</p>
    </div>
    <!-- Error State -->
    <div v-else-if="error" class="space-y-3">
      <div class="flex justify-center">
        <ShieldExclamationIcon class="text-unraid-red h-10" />
      </div>
      <div>
        <h3 class="font-bold">{{ `Error` }}</h3>
        <p>{{ error.message }}</p>
      </div>
      <Button type="button" class="w-full" @click="$emit('retry')">Try Again</Button>
    </div>
    <!-- Default state -->
    <slot v-else />
  </div>
</template>
