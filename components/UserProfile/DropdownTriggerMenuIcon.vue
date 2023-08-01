<script setup lang="ts">
import { Bars3Icon, XMarkIcon } from '@heroicons/vue/24/solid';

export interface Props {
  open?: boolean;
}
withDefaults(defineProps<Props>(), {
  open: false,
});
</script>
<template>
  <Bars3Icon v-if="!open" class="w-20px" />
  <XMarkIcon v-else class="w-20px" />
</template>
