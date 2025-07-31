<script setup lang="ts">
interface Props {
  icon?: string;
  title: string;
}

const _props = defineProps<Props>();
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
    <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
      <div class="flex items-center gap-3 sm:gap-4">
        <UIcon v-if="icon" :name="icon" class="h-10 w-10 sm:h-8 sm:w-8 flex-shrink-0" />
        <h1 class="text-2xl sm:text-2xl font-semibold truncate">
          {{ title }}
        </h1>
      </div>
      <div class="flex items-center gap-2 flex-wrap sm:mt-0">
        <slot name="right-content" />
      </div>
    </div>

    <div class="flex-shrink-0">
      <slot name="controls" />
    </div>
  </div>
</template>
