import type { badgeVariants } from '@/components/common/badge/badge.variants';
import type { VariantProps } from 'class-variance-authority';
import type { Component } from 'vue';

export interface UiBadgeProps extends VariantProps<typeof badgeVariants> {
  icon?: Component;
  iconRight?: Component;
  iconStyles?: string;
}
