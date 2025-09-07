<script setup lang="ts">
import { buttonVariants, type ButtonVariants } from '@/components/common/button/button.variants';
import { cn } from '@/lib/utils';
import { computed } from 'vue';

export interface ButtonProps {
  variant?: ButtonVariants['variant'];
  size?: ButtonVariants['size'];
  class?: string;
  disabled?: boolean;
  as?: string;
  href?: string | null;
  target?: string | null;
  rel?: string | null;
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const buttonClass = computed(() => {
  return cn(
    buttonVariants({ variant: props.variant, size: props.size }),
    'cursor-pointer select-none',
    props.disabled && 'pointer-events-none opacity-50',
    props.class
  );
});

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', event);
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (!props.disabled && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    // Create a synthetic click event
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    emit('click', clickEvent);
  }
};
</script>

<template>
  <a
    v-if="as === 'a'"
    :class="buttonClass"
    :href="href"
    :target="target"
    :rel="rel"
    :tabindex="disabled ? -1 : 0"
    :aria-disabled="disabled"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <slot />
  </a>
  <span
    v-else
    :class="buttonClass"
    role="button"
    :tabindex="disabled ? -1 : 0"
    :aria-disabled="disabled"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <slot />
  </span>
</template>
