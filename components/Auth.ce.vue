<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import { useServerStore } from '~/store/server';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

const { t } = useI18n();

const serverStore = useServerStore();
const { authAction, stateData } = storeToRefs(serverStore);
</script>

<template>
  <div class="whitespace-normal flex flex-col gap-y-16px max-w-3xl">
    <span v-if="stateData.error" class="text-unraid-red font-semibold leading-8">
      <h3 class="text-14px mb-8px">{{ t(stateData.heading) }}</h3>
      <span v-html="stateData.message" />
    </span>
    <span>
      <BrandButton
        v-if="authAction"
        :icon="authAction.icon"
        :text="t(authAction.text)"
        @click="authAction.click()"
      />
    </span>
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
