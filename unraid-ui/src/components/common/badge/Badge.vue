<script setup lang="ts">
import { computed } from "vue";
import type { UiBadgeProps } from "@/types/badge";
import { badgeVariants } from "./badge.variants";

const props = withDefaults(defineProps<UiBadgeProps>(), {
  variant: "gray",
  icon: undefined,
  iconRight: undefined,
  iconStyles: "",
  size: "md",
});

const badgeClasses = computed(() => {
  const iconSizes = {
    xs: "w-12px",
    sm: "w-14px",
    md: "w-16px",
    lg: "w-18px",
    xl: "w-20px",
    "2xl": "w-24px",
  } as const;

  return {
    badge: badgeVariants({ variant: props.variant, size: props.size }),
    icon: `${iconSizes[props.size ?? "md"]} ${props.iconStyles}`,
  };
});
</script>

<template>
  <span :class="badgeClasses.badge">
    <component
      :is="icon"
      v-if="icon"
      class="flex-shrink-0"
      :class="badgeClasses.icon"
    />
    <slot />
    <component
      :is="iconRight"
      v-if="iconRight"
      class="flex-shrink-0"
      :class="badgeClasses.icon"
    />
  </span>
</template>
