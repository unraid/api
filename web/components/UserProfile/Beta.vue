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
    class="text-xs uppercase py-1 px-1.5 border-2 rounded-full"
    :class="colorClasses"
  >
    {{ 'Beta' }}
  </span>
</template>
