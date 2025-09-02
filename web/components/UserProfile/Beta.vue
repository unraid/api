<script setup lang="ts">
export interface Props {
  colorClasses?: string
}

withDefaults(defineProps<Props>(), {
  colorClasses: 'text-grey-mid border-muted',
});
</script>

<template>
  <span
    class="text-xs uppercase py-1 px-1.5 border-2 border-muted rounded-full"
    :class="colorClasses"
  >
    {{ 'Beta' }}
  </span>
</template>
