<script setup lang="ts">
import { XCircleIcon } from '@heroicons/vue/24/solid';
import BrandLoading from '~/components/Brand/Loading.vue';
import BrandLoadingWhite from '~/components/Brand/LoadingWhite.vue';

export interface ButtonProps {
  btnStyle?: 'fill' | 'gray' | 'outline' | 'underline' | 'white';
  btnType?: 'button' | 'submit' | 'reset';
  click?: () => void;
  disabled?: boolean;
  download?: boolean;
  external?: boolean;
  href?: string;
  icon?: typeof XCircleIcon | typeof BrandLoading | typeof BrandLoadingWhite;
  iconRight?: typeof XCircleIcon | typeof BrandLoading | typeof BrandLoadingWhite;
  size?: '12px' | '14px' | '16px' | '18px' | '20px' | '24px';
  text?: string;
}
const props = withDefaults(defineProps<ButtonProps>(), {
  btnStyle: 'fill',
  btnType: 'button',
  click: undefined,
  href: undefined,
  icon: undefined,
  iconRight: undefined,
  size: '16px',
  text: undefined,
});

defineEmits(['click']);

const classes = computed(() => {
  let buttonColors = '';
  let buttonSize = '';
  let iconSize = '';

  switch (props.btnStyle) {
    case 'fill':
      buttonColors = 'text-white bg-gradient-to-r from-unraid-red to-orange shadow-none hover:from-unraid-red/60 hover:to-orange/60 focus:from-unraid-red/60 focus:to-orange/60 hover:shadow-md focus:shadow-md';
      break;
    case 'gray':
      buttonColors = 'text-black bg-grey shadow-none transition hover:text-white focus:text-white hover:bg-grey-mid focus:bg-grey-mid hover:shadow-md focus:shadow-md';
      break;
    case 'outline':
      buttonColors = 'text-orange bg-gradient-to-r from-transparent to-transparent border-2 border-solid border-orange shadow-none hover:text-white focus:text-white hover:from-unraid-red hover:to-orange focus:from-unraid-red focus:to-orange hover:shadow-md focus:shadow-md';
      break;
    case 'underline':
      buttonColors = 'opacity-75 hover:opacity-100 focus:opacity-100 underline transition shadow-none hover:text-alpha hover:bg-beta focus:text-alpha focus:bg-beta hover:shadow-md focus:shadow-md';
      break;
    case 'white':
      buttonColors = 'text-black bg-white shadow-none transition hover:bg-grey focus:bg-grey hover:shadow-md focus:shadow-md';
      break;
  }

  switch (props.size) {
    case '12px':
      buttonSize = 'text-12px px-8px py-4px gap-4px';
      iconSize = 'w-12px';
      break;
    case '14px':
      buttonSize = 'text-14px px-8px py-4px gap-8px';
      iconSize = 'w-14px';
      break;
    case '16px':
      buttonSize = 'text-16px px-12px py-8px gap-8px';
      iconSize = 'w-16px';
      break;
    case '18px':
      buttonSize = 'text-18px px-12px py-8px gap-8px';
      iconSize = 'w-18px';
      break;
    case '20px':
      buttonSize = 'text-20px px-16px py-12px gap-8px';
      iconSize = 'w-20px';
      break;
    case '24px':
      buttonSize = 'text-24px px-16px py-12px gap-8px';
      iconSize = 'w-24px';
      break;
  }

  return {
    button: `${buttonSize} ${buttonColors} text-center font-semibold flex flex-row items-center justify-center cursor-pointer rounded-md disabled:opacity-50 disabled:hover:opacity-50 disabled:focus:opacity-50 disabled:cursor-not-allowed`,
    icon: `${iconSize} fill-current flex-shrink-0`,
  };
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
    :class="classes.button"
    @click="click ?? $emit('click')"
  >
    <component v-if="icon" :is="icon" :class="classes.icon" />
    {{ text }}
    <component v-if="iconRight" :is="iconRight" :class="classes.icon" />
  </component>
</template>
