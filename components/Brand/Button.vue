<script setup lang="ts">
import { XCircleIcon } from '@heroicons/vue/24/solid';
export interface Props {
  click?: any; // @todo be more specific
  download?: boolean;
  external?: boolean;
  href?: string;
  icon?: typeof XCircleIcon;
  style?: 'fill' | 'outline';
  text?: string;
}
const props = withDefaults(defineProps<Props>(), {
  style: 'fill',
});

const classes = computed(() => {
  switch (props.style) {
    case 'fill':
      return 'text-white bg-gradient-to-r from-red to-orange hover:from-red/60 hover:to-orange/60 focus:from-red/60 focus:to-orange/60';
    case 'outline':
      return 'text-orange-dark bg-gradient-to-r from-transparent to-transparent border border-solid border-orange-dark hover:text-white focus:text-white hover:from-red hover:to-orange focus:from-red focus:to-orange hover:border-transparent focus:border-transparent';
  }
});
</script>

<template>
  <component
    :is="click ? 'button' : 'a'"
    @click="click() ?? null"
    :href="href"
    :rel="external ? 'noopener noreferrer' : ''"
    :target="external ? '_blank' : ''"
    class="text-14px text-center w-full flex-none flex flex-row items-center justify-center gap-x-8px px-8px py-8px cursor-pointer rounded-md"
    :class="classes"
  >
    <component v-if="icon" :is="icon" class="flex-shrink-0 w-14px" />
    {{ text }}
  </component>
</template>

<style scoped>

</style>