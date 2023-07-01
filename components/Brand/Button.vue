<script setup lang="ts">
import { XCircleIcon } from '@heroicons/vue/24/solid';
export interface Props {
  btnStyle?: 'fill' | 'outline' | 'underline';
  btnType?: 'button' | 'submit' | 'reset';
  download?: boolean;
  external?: boolean;
  href?: string;
  icon?: typeof XCircleIcon;
  text?: string;
}
const props = withDefaults(defineProps<Props>(), {
  btnStyle: 'fill',
  btnType: 'button',
});

defineEmits(['click']);

const classes = computed(() => {
  switch (props.btnStyle) {
    case 'fill':
      return 'text-white bg-gradient-to-r from-unraid-red to-orange hover:from-unraid-red/60 hover:to-orange/60 focus:from-unraid-red/60 focus:to-orange/60';
    case 'outline':
      return 'text-orange bg-gradient-to-r from-transparent to-transparent border border-solid border-orange hover:text-white focus:text-white hover:from-unraid-red hover:to-orange focus:from-unraid-red focus:to-orange hover:border-transparent focus:border-transparent';
    case 'underline':
      return 'opacity-75 hover:opacity-100 focus:opacity-100 underline transition hover:text-alpha hover:bg-beta focus:text-alpha focus:bg-beta';
  }
});
</script>

<template>
  <component
    :is="href ? 'a' : 'button'"
    @click="$emit('click')"
    :href="href"
    :rel="external ? 'noopener noreferrer' : ''"
    :target="external ? '_blank' : ''"
    :type="!href ? btnType : ''"
    class="text-14px text-center font-semibold flex-none flex flex-row items-center justify-center gap-x-8px px-8px py-8px cursor-pointer rounded-md"
    :class="classes"
  >
    <component v-if="icon" :is="icon" class="flex-shrink-0 w-14px" />
    {{ text }}
  </component>
</template>
