<script setup lang="ts">
import { badgeVariants, type BadgeVariants } from '@/components/common/badge/badge.variants';
import { computed } from 'vue';
import type { Component } from 'vue';

export interface BadgeProps {
  variant?: BadgeVariants['variant'];
  size?: BadgeVariants['size'];
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
    xs: 'w-3',
    sm: 'w-3.5',
    md: 'w-4',
    lg: 'w-4.5',
    xl: 'w-5',
    '2xl': 'w-6',
  } as const;

  return {
    badge: badgeVariants({ variant: props.variant, size: props.size }),
    icon: `${iconSizes[props.size ?? 'md']} ${props.iconStyles}`,
  };
});
</script>

<template>
  <span :class="[badgeClasses.badge, props.class]">
    <component :is="icon" v-if="icon" class="shrink-0" :class="badgeClasses.icon" />
    <slot />
    <component :is="iconRight" v-if="iconRight" class="shrink-0" :class="badgeClasses.icon" />
  </span>
</template>
