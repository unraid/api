<script setup lang="ts">
import { computed } from 'vue';
import { type BrandButtonVariants, brandButtonVariants } from './brand-button.variants';
import { cn } from '@/lib/utils';

export interface BrandButtonProps {
  variant?: BrandButtonVariants['variant'];
  size?: BrandButtonVariants['size'];
  padding?: BrandButtonVariants['padding'];
  btnType?: 'button' | 'submit' | 'reset';
  class?: string;
  click?: () => void;
  disabled?: boolean;
  external?: boolean;
  href?: string;
  icon?: any;
  iconRight?: any;
  iconRightHoverDisplay?: boolean;
  text?: string;
  title?: string;
}

const props = withDefaults(defineProps<BrandButtonProps>(), {
  variant: 'fill',
  size: '16px',
  padding: 'default',
  btnType: 'button',
  class: undefined,
  click: undefined,
  disabled: false,
  external: false,
  href: undefined,
  icon: undefined,
  iconRight: undefined,
  iconRightHoverDisplay: false,
  text: '',
  title: '',
});

defineEmits(['click']);

const classes = computed(() => {
  const iconSize = `w-${props.size}`;

  return {
    button: cn(brandButtonVariants({ variant: props.variant, size: props.size, padding: props.padding }), props.class),
    icon: `${iconSize} fill-current flex-shrink-0`,
  };
});
</script>

<template>
  <component
    :is="href ? 'a' : 'button'"
    :disabled="disabled"
    :href="href"
    :rel="external ? 'noopener noreferrer' : ''"
    :target="external ? '_blank' : ''"
    :type="!href ? btnType : ''"
    :class="classes.button"
    :title="title"
    @click="click ?? $emit('click')"
  >
    <div
      v-if="variant === 'fill'"
      class="absolute -top-[2px] -right-[2px] -bottom-[2px] -left-[2px] -z-10 bg-gradient-to-r from-unraid-red to-orange opacity-100 transition-all rounded-md group-hover:opacity-60 group-focus:opacity-60"
    />
    <div
      v-if="variant?.includes('outline')"
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
