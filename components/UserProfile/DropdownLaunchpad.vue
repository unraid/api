<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useServerStore } from '~/store/server';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

const { expireTime, state, stateData } = storeToRefs(useServerStore());

const showExpireTime = computed(() => {
  return (state.value === 'TRIAL' || state.value === 'EEXPIRED') && expireTime.value > 0;
});
</script>

<template>
  <div class="flex flex-col gap-y-24px w-full min-w-300px md:min-w-[500px] max-w-4xl p-16px">
    <header class="text-center">
      <h2 class="text-24px font-semibold">Thank you for installing Connect!</h2>
      <h3>Sign In to your Unraid.net account to register your server</h3>
      <UpcUptimeExpire v-if="showExpireTime" class="opacity-75 mt-12px" />
    </header>
    <ul class="list-reset flex flex-col gap-y-8px px-16px" v-if="stateData.actions">
      <li v-for="action in stateData.actions" :key="action.name">
        <component
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
      </li>
    </ul>
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
