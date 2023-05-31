<script setup lang="ts">
export interface Props {
  colorClasses?: string
}

withDefaults(defineProps<Props>(), {
  colorClasses: 'text-grey-mid border-grey-mid',
});
</script>

<template>
  <span
    class="text-10px uppercase py-4px px-6px border-2 rounded-full"
    :class="colorClasses"
  >
    {{ 'Beta' }}
  </span>
</template>
