<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useServerStore } from '~/store/server';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

const { keyActions } = storeToRefs(useServerStore());
</script>

<template>
  <template v-if="keyActions">
    <component
      v-for="action in keyActions" :key="action.name"
      :is="action.click ? 'button' : 'a'"
      @click="action.click()"
      rel="noopener noreferrer"
      class="text-white text-14px text-center w-full flex-none flex flex-row items-center justify-center gap-x-8px px-8px py-8px cursor-pointer rounded-md bg-gradient-to-r from-red to-orange hover:from-red/60 hover:to-orange/60 focus:from-red/60 focus:to-orange/60"
      target="_blank"
      download
    >
      <component v-if="action.icon" :is="action.icon" class="flex-shrink-0 w-14px" />
      {{ action.text }}
    </component>
  </template>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
