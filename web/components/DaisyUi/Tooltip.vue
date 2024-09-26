<script setup lang="ts">
const props = defineProps<{
  forceOpen?: boolean;
  position: "top" | "right" | "bottom" | "left";
  text: string;
}>();

const forceOpenClass = computed(() => (props.forceOpen ? "tooltip-open" : ""));
const positionClass = computed(() => {
  switch (props.position) {
    case "right":
      return "tooltip-right";
    case "bottom":
      return "tooltip-bottom";
    case "left":
      return "tooltip-left";
    default:
      return "tooltip-top";
  }
});
</script>

<template>
  <div class="tooltip" :class="[forceOpenClass, positionClass]" :data-tip="text">
    <slot />
  </div>
</template>
