<script setup lang="ts">
interface Props {
  icon?: string;
  title: string;
}

const _props = defineProps<Props>();
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
    <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
      <div class="flex items-center gap-3 mb-2 sm:gap-4 lg:mb-0">
        <UIcon v-if="icon" :name="icon" class="h-8 w-8 flex-shrink-0" />
        <h1 class="text-2xl font-semibold truncate leading-none">
          {{ title }}
        </h1>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <slot name="right-content" />
      </div>
    </div>

    <div class="flex items-center flex-shrink-0">
      <slot name="controls" />
    </div>
  </div>
</template>
