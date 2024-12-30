<script setup lang="ts">
import { type HTMLAttributes, computed } from "vue";
import { TabsList, type TabsListProps } from "radix-vue";
import { cn } from "@/lib/utils";

const props = defineProps<
  TabsListProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <TabsList
    v-bind="delegatedProps"
    :class="
      cn(
        'inline-flex items-center justify-center rounded-md bg-input p-1.5 text-foreground',
        props.class
      )
    "
  >
    <slot />
  </TabsList>
</template>
