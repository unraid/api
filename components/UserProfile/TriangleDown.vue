<script setup lang="ts">
export interface Props {
  open?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  open: false,
});
</script>
<template>
  <span
    class="w-0 h-0 border-t-[4px] border-l-[4px] border-r-[4px] border-t-solid border-t-black border-l-solid border-l-transparent border-r-solid border-r-transparent transition-transform"
    :class="{
      '-rotate-180': open,
      'rotate-0': !open,
    }"
  />
</template>