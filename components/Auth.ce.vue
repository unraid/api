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
      {{ stateData.message }}
    </span>
    <span>
      <component
        v-if="button"
        :is="button.click ? 'button' : 'a'"
        @click="button.click()"
        rel="noopener noreferrer"
        class="text-white text-14px text-center w-full flex-none flex flex-row items-center justify-center gap-x-8px px-8px py-8px cursor-pointer rounded-md bg-gradient-to-r from-unraid-red to-orange hover:from-unraid-red/60 hover:to-orange/60 focus:from-unraid-red/60 focus:to-orange/60"
        target="_blank"
        download
      >
        <component v-if="button.icon" :is="button.icon" class="flex-shrink-0 w-14px" />
        {{ button.text }}
      </component>
    </span>
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
