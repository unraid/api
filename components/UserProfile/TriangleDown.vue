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
    class="w-0 h-0 border-t-[6px] border-l-[6px] border-r-[6px] border-t-solid border-t-black border-l-solid border-l-transparent border-r-solid border-r-transparent transition-transform"
    :class="{
      '-rotate-180': open,
      'rotate-0': !open,
    }"
  />
</template>