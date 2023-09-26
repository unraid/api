<script setup lang="ts">
export interface Props {
  label?: string;
  text?: number | string | undefined;
  t: any;
}
withDefaults(defineProps<Props>(), {
  label: '',
  text: '',
});
</script>
<template>
  <div class="text-16px p-16px sm:px-20px sm:grid sm:grid-cols-3 sm:gap-16px even:bg-gray-200/50">
    <dt class="font-semibold">{{ t(label) }}</dt>
    <dd class="mt-4px leading-normal sm:col-span-2 sm:mt-0">
      <span v-if="text" class="opacity-75">{{ text }}</span>
      <template v-else-if="$slots['text']">
        <slot name="text"></slot>
      </template>
    </dd>
  </div>
</template>
