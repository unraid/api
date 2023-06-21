<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useServerStore } from '~/store/server';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

const { keyActions } = storeToRefs(useServerStore());
</script>

<template>
  <div v-if="keyActions" class="flex flex-col gap-y-8px">
    <!-- <BrandButton
        v-for="action in keyActions" :key="action.name"
        :click="action.click()"
        :icon="action.icon"
        :text="action.text"
      /> -->
    <component
      v-for="action in keyActions" :key="action.name"
      :is="action.click ? 'button' : 'a'"
      @click="action.click()"
      rel="noopener noreferrer"
      class="text-white text-14px text-center w-full flex-none flex flex-row items-center justify-center gap-x-8px px-8px py-8px cursor-pointer rounded-md bg-gradient-to-r from-unraid-red to-orange hover:from-unraid-red/60 hover:to-orange/60 focus:from-unraid-red/60 focus:to-orange/60"
      target="_blank"
      download
    >
      <component v-if="action.icon" :is="action.icon" class="flex-shrink-0 w-14px" />
      {{ action.text }}
    </component>
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
