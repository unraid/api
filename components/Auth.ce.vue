<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { ExclamationTriangleIcon } from '@heroicons/vue/24/solid';
import { useServerStore } from '~/store/server';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

const serverStore = useServerStore();
const { authAction, stateData } = storeToRefs(serverStore);

// @todo use callback url
const stateDataErrorAction = computed(() => {
  return {
    click: () => { console.debug('accountServerPayload') },
    external: true,
    icon: ExclamationTriangleIcon,
    name: 'accountServer',
    text: 'Fix Error',
  }
});

const button = computed(() => {
  if (stateData.value.error) return stateDataErrorAction.value;
  return authAction.value;
});
</script>

<template>
  <div class="whitespace-normal flex flex-col gap-y-16px max-w-3xl">
    <span v-if="stateData.error" class="text-unraid-red font-semibold leading-8">
      {{ stateData.heading }}
      <br />
      <span v-html="stateData.message"></span>
    </span>
    <span>
      <BrandButton
        v-if="button"
        @click="button.click()"
        :icon="button.icon"
        :text="button.text" />
    </span>
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
