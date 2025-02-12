<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';
import { badgeVariants } from './badge.variants';

export interface BadgeProps {
  variant?:
    | 'red'
    | 'yellow'
    | 'green'
    | 'blue'
    | 'indigo'
    | 'purple'
    | 'pink'
    | 'orange'
    | 'black'
    | 'white'
    | 'transparent'
    | 'current'
    | 'gray'
    | 'custom';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  icon?: Component;
  iconRight?: Component;
  iconStyles?: string;
  class?: string;
}

const props = withDefaults(defineProps<BadgeProps>(), {
  variant: 'gray',
  size: 'md',
  icon: undefined,
  iconRight: undefined,
  iconStyles: '',
  class: '',
});

const badgeClasses = computed(() => {
  const iconSizes = {
    xs: 'w-12px',
    sm: 'w-14px',
    md: 'w-16px',
    lg: 'w-18px',
    xl: 'w-20px',
    '2xl': 'w-24px',
  } as const;

  return {
    badge: badgeVariants({ variant: props.variant, size: props.size }),
    icon: `${iconSizes[props.size ?? 'md']} ${props.iconStyles}`,
  };
});
</script>

<template>
  <span :class="[badgeClasses.badge, props.class]">
    <component :is="icon" v-if="icon" class="flex-shrink-0" :class="badgeClasses.icon" />
    <slot />
    <component :is="iconRight" v-if="iconRight" class="flex-shrink-0" :class="badgeClasses.icon" />
  </span>
</template>
