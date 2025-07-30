<script setup lang="ts">
import { UIcon } from '#components';

interface Props {
  icon?: string;
  title: string;
}

const _props = defineProps<Props>();
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <UIcon v-if="icon" :name="icon" class="h-8 w-8 flex-shrink-0" />
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-semibold">
          {{ title }}
        </h1>
        <slot name="right-content" />
      </div>
    </div>

    <slot name="controls" />
  </div>
</template>
