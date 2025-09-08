<script setup lang="ts">
interface Props {
  icon?: string;
  title: string;
}

defineProps<Props>();
</script>

<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
    <div class="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <div class="mb-2 flex items-center gap-3 sm:gap-4 lg:mb-0">
        <UIcon v-if="icon" :name="icon" class="h-8 w-8 flex-shrink-0" />
        <h1 class="truncate text-2xl leading-none font-semibold">
          {{ title }}
        </h1>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <slot name="right-content" />
      </div>
    </div>

    <div class="flex flex-shrink-0 items-center">
      <slot name="controls" />
    </div>
  </div>
</template>
