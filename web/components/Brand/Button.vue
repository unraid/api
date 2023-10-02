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
  iconRightHover?: boolean;
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
  iconRightHover: false,
  size: '16px',
  text: undefined,
});

defineEmits(['click']);

const classes = computed(() => {
  /** @todo consider underline for all buttons to improve accessibility and quick readability */
  const buttonDefaults = 'group text-center font-semibold leading-none relative z-0 flex flex-row items-center justify-center cursor-pointer rounded-md shadow-none hover:shadow-md focus:shadow-md disabled:opacity-50 disabled:hover:opacity-50 disabled:focus:opacity-50 disabled:cursor-not-allowed';
  let buttonColors = '';
  let buttonSize = '';
  let iconSize = '';

  switch (props.btnStyle) {
    case 'fill':
      buttonColors = 'text-white';
      break;
    case 'gray':
      buttonColors = 'text-black bg-grey transition hover:text-white focus:text-white hover:bg-grey-mid focus:bg-grey-mid';
      break;
    case 'outline':
      buttonColors = 'text-orange bg-transparent border-2 border-solid border-orange hover:text-white focus:text-white';
      break;
    case 'underline':
      buttonColors = 'opacity-75 hover:opacity-100 focus:opacity-100 underline transition hover:text-alpha hover:bg-beta focus:text-alpha focus:bg-beta';
      break;
    case 'white':
      buttonColors = 'text-black bg-white transition hover:bg-grey focus:bg-grey';
      break;
  }

  switch (props.size) {
    case '12px':
      buttonSize = 'text-12px p-8px gap-4px';
      iconSize = 'w-12px';
      break;
    case '14px':
      buttonSize = 'text-14px p-8px gap-8px';
      iconSize = 'w-14px';
      break;
    case '16px':
      buttonSize = 'text-16px p-12px gap-8px';
      iconSize = 'w-16px';
      break;
    case '18px':
      buttonSize = 'text-18px p-12px gap-8px';
      iconSize = 'w-18px';
      break;
    case '20px':
      buttonSize = 'text-20px p-16px gap-8px';
      iconSize = 'w-20px';
      break;
    case '24px':
      buttonSize = 'text-24px p-16px gap-8px';
      iconSize = 'w-24px';
      break;
  }

  return {
    button: `${buttonSize} ${buttonColors} ${buttonDefaults}`,
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

    <div v-if="btnStyle === 'fill'"
      class="absolute inset-0 -z-10 bg-gradient-to-r from-unraid-red to-orange opacity-100 transition-all rounded-md group-hover:opacity-60 group-focus:opacity-60" />
    <div v-if="btnStyle === 'outline'"
      class="absolute -top-[2px] -right-[2px] -bottom-[2px] -left-[2px] -z-10 bg-gradient-to-r from-unraid-red to-orange opacity-0  transition-all rounded-md group-hover:opacity-100 group-focus:opacity-100" />

    <component
      v-if="icon"
      :is="icon"
      :class="classes.icon" />

    {{ text }}

    <component
      v-if="iconRight"
      :is="iconRight"
      :class="[
        classes.icon,
        iconRightHover ? 'opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all' : '',
      ]" />
  </component>
</template>

<style lang="postcss">
/* .button-gradient-border-to-bg {
  background: linear-gradient(to right,#e03237 0%,#fd8c3c 100%) left top no-repeat,linear-gradient(to right,#e03237 0%,#fd8c3c 100%) left bottom no-repeat,linear-gradient(to top,#e03237 0%,#e03237 100%) left bottom no-repeat,linear-gradient(to top,#fd8c3c 0%,#fd8c3c 100%) right bottom no-repeat;
  background-size: 100% 2px,100% 2px,2px 100%,2px 100%;

  &:hover,
  &:focus {
    background: linear-gradient(to right,#E22828 0%,#FF8C2F 100%);
  }
} */
</style>