<script setup lang="ts">
import { computed } from "vue";
import { buttonVariants } from "@/components/common/Button/button.variants";
import { cn } from "@/lib/utils";

interface Props {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "default",
  size: "default",
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
