<script setup lang="ts">
import { XCircleIcon } from '@heroicons/vue/24/solid';
import BrandLoading from '~/components/Brand/Loading.vue';
import BrandLoadingWhite from '~/components/Brand/LoadingWhite.vue';

export interface ButtonProps {
  btnStyle?: 'fill' | 'outline' | 'underline';
  btnType?: 'button' | 'submit' | 'reset';
  click?: () => void;
  disabled?: boolean;
  download?: boolean;
  external?: boolean;
  href?: string;
  icon?: typeof XCircleIcon | typeof BrandLoading | typeof BrandLoadingWhite;
  iconRight?: typeof XCircleIcon | typeof BrandLoading | typeof BrandLoadingWhite;
  text?: string;
}
const props = withDefaults(defineProps<ButtonProps>(), {
  btnStyle: 'fill',
  btnType: 'button',
  click: undefined,
  href: undefined,
  icon: undefined,
  iconRight: undefined,
  text: undefined,
});

defineEmits(['click']);

const classes = computed(() => {
  switch (props.btnStyle) {
    case 'fill':
      return 'text-white bg-gradient-to-r from-unraid-red to-orange shadow-none hover:from-unraid-red/60 hover:to-orange/60 focus:from-unraid-red/60 focus:to-orange/60 hover:shadow-md focus:shadow-md';
    case 'outline':
      return 'text-orange bg-gradient-to-r from-transparent to-transparent border-2 border-solid border-orange shadow-none hover:text-white focus:text-white hover:from-unraid-red hover:to-orange focus:from-unraid-red focus:to-orange hover:shadow-md focus:shadow-md';
    case 'underline':
      return 'opacity-75 hover:opacity-100 focus:opacity-100 underline transition shadow-none hover:text-alpha hover:bg-beta focus:text-alpha focus:bg-beta hover:shadow-md focus:shadow-md';
  }
});
</script>

<template>
  <component
    :is="href ? 'a' : 'button'"
    :disabled="disabled ?? null"
    :href="href"
    :rel="external ? 'noopener noreferrer' : ''"
    :target="external ? '_blank' : ''"
    :type="!href ? btnType : ''"
    class="text-14px text-center font-semibold flex-none flex flex-row items-center justify-center gap-x-8px px-8px py-8px cursor-pointer rounded-md disabled:opacity-50 disabled:hover:opacity-50 disabled:focus:opacity-50 disabled:cursor-not-allowed"
    :class="classes"
    @click="click ?? $emit('click')"
  >
    <component :is="icon" v-if="icon" class="flex-shrink-0 w-14px" />
    {{ text }}
    <component :is="iconRight" v-if="iconRight" class="flex-shrink-0 w-14px" />
  </component>
</template>
