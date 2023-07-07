<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useServerStore } from '~/store/server';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

const { keyActions } = storeToRefs(useServerStore());
</script>

<template>
  <ul v-if="keyActions" class="flex flex-col gap-y-8px">
    <li v-for="action in keyActions" :key="action.name">
      <BrandButton
        class="w-full max-w-300px"
        @click="action.click()"
        :external="action?.external"
        :href="action?.href"
        :icon="action.icon"
        :text="action.text"
      />
    </li>
  </ul>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
