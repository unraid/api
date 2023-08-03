<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useServerStore } from '~/store/server';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

const props = defineProps<{ t: any; }>();

const { expireTime, connectPluginInstalled, registered, state, stateData } = storeToRefs(useServerStore());

const showConnectCopy = computed(() => (connectPluginInstalled.value && !registered.value && !stateData.value?.error));

const heading = computed(() => {
  if (showConnectCopy.value) { return props.t('Thank you for installing Connect!'); }
  return props.t(stateData.value.heading);
});

const subheading = computed(() => {
  if (showConnectCopy.value) { return props.t('Sign In to your Unraid.net account to get started'); }
  return props.t(stateData.value.message);
});

const showExpireTime = computed(() => {
  return (state.value === 'TRIAL' || state.value === 'EEXPIRED') && expireTime.value > 0;
});
</script>

<template>
  <div class="flex flex-col gap-y-24px w-full min-w-300px md:min-w-[500px] max-w-xl p-16px">
    <header :class="{ 'text-center': showConnectCopy }">
      <h2 class="text-24px text-center font-semibold" v-html="heading" />
      <div class="flex flex-col gap-y-8px" v-html="subheading" />
      <UpcUptimeExpire
        v-if="showExpireTime"
        class="text-center opacity-75 mt-12px"
        :t="t"
      />
    </header>
    <ul v-if="stateData.actions" class="list-reset flex flex-col gap-y-8px px-16px">
      <li v-for="action in stateData.actions" :key="action.name">
        <BrandButton
          class="w-full"
          :external="action?.external"
          :href="action?.href"
          :icon="action.icon"
          :text="t(action.text)"
          @click="action.click()"
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
