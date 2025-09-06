<script setup lang="ts">
export interface Props {
  colorClasses?: string;
}

withDefaults(defineProps<Props>(), {
  colorClasses: 'text-grey-mid border-muted',
});
</script>

<template>
  <span class="border-muted rounded-full border-2 px-1.5 py-1 text-xs uppercase" :class="colorClasses">
    {{ 'Beta' }}
  </span>
</template>
