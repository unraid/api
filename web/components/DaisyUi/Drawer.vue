<script setup lang="ts">
import { XMarkIcon } from "@heroicons/vue/20/solid";
// const props =

withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    contentPadding?: boolean;
    positionRight?: boolean;
    showCloseButton?: boolean;
  }>(),
  {
    title: "",
    description: "",
    contentPadding: true,
    positionRight: true,
    showCloseButton: true,
  }
);
</script>

<template>
  <div class="drawer z-10" :class="[positionRight && 'drawer-end']">
    <input id="my-drawer" type="checkbox" class="drawer-toggle" >
    <div class="drawer-content">
      <label for="my-drawer" class="drawer-button">
        <slot name="trigger" />
      </label>
    </div>
    <div class="drawer-side">
      <label for="my-drawer" aria-label="close sidebar" class="drawer-overlay" />
      <div
        class="menu bg-base-100 text-base-content min-h-full w-full max-w-[420px] flex flex-col gap-4 p-0"
      >
        <header class="flex flex-row justify-between items-start p-4 gap-4">
          <div v-if="title || description || $slots['header']">
            <h2 v-if="title" class="text-lg font-semibold">{{ title }}</h2>
            <p v-if="description" class="text-base-content">
              {{ description }}
            </p>
            <slot name="header" />
          </div>
          <label
            v-if="showCloseButton"
            for="my-drawer"
            class="grow-0 shrink-0 cursor-pointer"
            :title="`Close ${title}`"
          >
            <XMarkIcon class="w-6 h-6" />
          </label>
        </header>
        <div class="overflow-y-auto" :class="[contentPadding && 'p-4']">
          <slot name="content" />
        </div>
        <footer v-if="$slots['footer']">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </div>
</template>
