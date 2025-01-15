<script setup lang="ts">
import { computed } from "vue";
import { buttonVariants } from "./button.variants";
import { cn } from "@/lib/utils";

export interface ButtonProps {
  variant?:
    | "primary"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "sm" | "md" | "lg" | "icon";
  class?: string;
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: "primary",
  size: "md",
});

const buttonClass = computed(() => {
  return cn(
    buttonVariants({ variant: props.variant, size: props.size }),
    props.class
  );
});
</script>

<template>
  <button :class="buttonClass">
    <slot />
  </button>
</template>
