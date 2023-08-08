<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import { useServerStore } from '~/store/server';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

const { t } = useI18n();
const { keyActions } = storeToRefs(useServerStore());

console.log('[keyActions]', keyActions.value);
</script>

<template>
  <ul v-if="keyActions" class="flex flex-col gap-y-8px">
    <li v-for="action in keyActions" :key="action.name">
      <BrandButton
        class="w-full max-w-300px"
        :disabled="action?.disabled"
        :external="action?.external"
        :href="action?.href"
        :icon="action.icon"
        :text="t(action.text)"
        @click="action.click()"
      />
    </li>
  </ul>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
