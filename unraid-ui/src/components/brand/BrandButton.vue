<script setup lang="ts">
import { brandButtonVariants, type BrandButtonVariants } from '@/components/brand/brand-button.variants';
import { cn } from '@/lib/utils';
import { computed } from 'vue';

export interface BrandButtonProps {
  variant?: BrandButtonVariants['variant'];
  size?: BrandButtonVariants['size'];
  padding?: BrandButtonVariants['padding'];
  class?: string;
  click?: () => void;
  disabled?: boolean;
  external?: boolean;
  href?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  iconRight?: any;
  iconRightHoverDisplay?: boolean;
  text?: string;
  title?: string;
}

const props = withDefaults(defineProps<BrandButtonProps>(), {
  variant: 'fill',
  size: '16px',
  padding: 'default',
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

const emit = defineEmits<{
  (event: 'click'): void;
}>();

const classes = computed(() => {
  return {
    button: cn(
      brandButtonVariants({ variant: props.variant, size: props.size, padding: props.padding }),
      props.class
    ),
    icon: 'w-[var(--icon-size)] fill-current shrink-0',
    iconSize: props.size ?? '16px',
  };
});

const needsBrandGradientBackground = computed(() => {
  return ['outline', 'outline-solid', 'outline-primary'].includes(props.variant ?? '');
});

const isLink = computed(() => Boolean(props.href));
const isButton = computed(() => !isLink.value);

const triggerClick = () => {
  if (props.click) {
    props.click();
  } else {
    emit('click');
  }
};

const handleClick = () => {
  if (!props.disabled) {
    triggerClick();
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (!isButton.value || props.disabled) {
    return;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    triggerClick();
  }
};
</script>

<template>
  <component
    :is="isLink ? 'a' : 'span'"
    :role="isButton ? 'button' : undefined"
    :tabindex="isButton && !disabled ? 0 : undefined"
    :aria-disabled="isButton && disabled ? true : undefined"
    :href="href"
    :rel="external ? 'noopener noreferrer' : ''"
    :target="external ? '_blank' : ''"
    :class="classes.button"
    :title="title"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <div
      v-if="variant === 'fill' && !disabled"
      class="from-unraid-red to-orange absolute -top-[2px] -right-[2px] -bottom-[2px] -left-[2px] -z-10 rounded-md bg-linear-to-r opacity-100 transition-all group-hover:!opacity-60 group-focus:!opacity-60"
    />

    <!-- gives outline buttons the brand gradient background -->
    <div
      v-if="needsBrandGradientBackground && !disabled"
      :class="[
        'from-unraid-red to-orange pointer-events-none absolute -top-[2px] -right-[2px] -bottom-[2px] -left-[2px] -z-10 bg-linear-to-r transition-all',
        variant === 'outline-primary' ? 'rounded-sm' : 'rounded-md',
        'opacity-0 group-hover:!opacity-100 group-focus:!opacity-100',
      ]"
    />

    <component
      :is="icon"
      v-if="icon"
      :class="classes.icon"
      :style="{ '--icon-size': classes.iconSize }"
    />

    {{ text }}
    <slot />

    <component
      :is="iconRight"
      v-if="iconRight"
      :class="[
        classes.icon,
        iconRightHoverDisplay &&
          'opacity-0 transition-all group-hover:!opacity-100 group-focus:!opacity-100',
      ]"
      :style="{ '--icon-size': classes.iconSize }"
    />
  </component>
</template>
