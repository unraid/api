<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useServerStore } from '~/store/server';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

const { expireTime, pluginInstalled, state, stateData } = storeToRefs(useServerStore());

const heading = computed(() => {
  if (pluginInstalled.value) return 'Thank you for installing Connect!';
  return stateData.value.heading;
});

const subheading = computed(() => {
  if (pluginInstalled.value) return 'Sign In to your Unraid.net account to get started';
  return stateData.value.message;
});

const showExpireTime = computed(() => {
  return (state.value === 'TRIAL' || state.value === 'EEXPIRED') && expireTime.value > 0;
});
</script>

<template>
  <div class="flex flex-col gap-y-24px w-full min-w-300px md:min-w-[500px] max-w-4xl p-16px">
    <header :class="{ 'text-center': pluginInstalled }">
      <h2 class="text-24px text-center font-semibold" v-html="heading" />
      <div v-html="subheading" class="flex flex-col gap-y-8px" />
      <UpcUptimeExpire v-if="showExpireTime" class="opacity-75 mt-12px" />
    </header>
    <ul class="list-reset flex flex-col gap-y-8px px-16px" v-if="stateData.actions">
      <li v-for="action in stateData.actions" :key="action.name">
        <BrandButton
          class="w-full"
          @click="action.click()"
          :icon="action.icon"
          :text="action.text"
        />
      </li>
    </ul>
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
