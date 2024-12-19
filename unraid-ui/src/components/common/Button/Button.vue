<script setup lang="ts">
import { computed } from "vue";
import { ButtonVariants } from "./Button.variants";
import { cn } from "@/lib/utils";

interface Props {
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

const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  size: "md",
});

const buttonClass = computed(() => {
  return cn(
    ButtonVariants({ variant: props.variant, size: props.size }),
    props.class
  );
});
</script>

<template>
  <button :class="buttonClass">
    <slot />
  </button>
</template>
