<script setup lang="ts">
import { computed } from 'vue';

import type { ButtonProps } from '~/types/ui/button';

const props = withDefaults(defineProps<ButtonProps>(), {
  btnStyle: 'fill',
  btnType: 'button',
  click: undefined,
  href: undefined,
  icon: undefined,
  iconRight: undefined,
  iconRightHoverDisplay: false,
  // iconRightHoverAnimate: true,
  size: '16px',
  text: '',
  title: '',
});

defineEmits(['click']);

const classes = computed(() => {
  /** @todo consider underline for all buttons to improve accessibility and quick readability */
  const buttonDefaults = 'group text-center font-semibold leading-none relative z-0 flex flex-row items-center justify-center border-2 border-solid shadow-none cursor-pointer rounded-md hover:shadow-md focus:shadow-md disabled:opacity-25 disabled:hover:opacity-25 disabled:focus:opacity-25 disabled:cursor-not-allowed';
  let buttonColors = '';
  let buttonSize = '';
  let iconSize = '';

  switch (props.btnStyle) {
    case 'black':
      buttonColors = 'text-white bg-black border-black transition hover:text-black focus:text-black  hover:bg-grey focus:bg-grey hover:border-grey focus:border-grey';
      break;
    case 'fill':
      buttonColors = 'text-white bg-transparent border-transparent'; // border and bg are set in the template
      break;
    case 'gray':
      buttonColors = 'text-black bg-grey transition hover:text-white focus:text-white hover:bg-grey-mid focus:bg-grey-mid hover:border-grey-mid focus:border-grey-mid';
      break;
    case 'outline': // border and bg are set in the template
      buttonColors = 'text-orange bg-transparent border-orange hover:text-white focus:text-white';
      break;
    case 'outline-black':
      buttonColors = 'text-black bg-transparent border-black hover:text-black focus:text-black hover:bg-grey focus:bg-grey hover:border-grey focus:border-grey';
      break;
    case 'outline-white':
      buttonColors = 'text-white bg-transparent border-white hover:text-black focus:text-black hover:bg-white focus:bg-white';
      break;
    case 'underline':
      buttonColors = 'opacity-75 underline border-transparent transition hover:text-alpha hover:bg-beta hover:border-beta focus:text-alpha focus:bg-beta focus:border-beta hover:opacity-100 focus:opacity-100';
      break;
    case 'underline-hover-red':
      buttonColors = 'opacity-75 underline border-transparent transition hover:text-white hover:bg-unraid-red hover:border-unraid-red focus:text-white focus:bg-unraid-red focus:border-unraid-red hover:opacity-100 focus:opacity-100';
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
    :title="title"
    @click="click ?? $emit('click')"
  >
    <div
      v-if="btnStyle === 'fill'"
      class="absolute -top-[2px] -right-[2px] -bottom-[2px] -left-[2px] -z-10 bg-gradient-to-r from-unraid-red to-orange opacity-100 transition-all rounded-md group-hover:opacity-60 group-focus:opacity-60"
    />
    <div
      v-if="btnStyle === 'outline'"
      class="absolute -top-[2px] -right-[2px] -bottom-[2px] -left-[2px] -z-10 bg-gradient-to-r from-unraid-red to-orange opacity-0 transition-all rounded-md group-hover:opacity-100 group-focus:opacity-100"
    />

    <component
      :is="icon"
      v-if="icon"
      :class="classes.icon"
    />

    {{ text }}
    <slot />

    <component
      :is="iconRight"
      v-if="iconRight"
      :class="[
        classes.icon,
        iconRightHoverDisplay && 'opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all',
      ]"
    />
  </component>
</template>
