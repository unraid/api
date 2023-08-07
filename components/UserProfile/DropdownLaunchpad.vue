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

.DropdownWrapper_blip {
  box-shadow: var(--ring-offset-shadow), var(--ring-shadow), var(--shadow-beta);

  &::before {
    @apply absolute z-20 block;

    content: '';
    width: 0;
    height: 0;
    top: -10px;
    right: 42px;
    border-right: 11px solid transparent;
    border-bottom: 11px solid var(--color-alpha);
    border-left: 11px solid transparent;
  }
}

.unraid_mark_2,
.unraid_mark_4 {
  animation: mark_2 1.5s ease infinite;
}
.unraid_mark_3 {
  animation: mark_3 1.5s ease infinite;
}
.unraid_mark_6,
.unraid_mark_8 {
  animation: mark_6 1.5s ease infinite;
}
.unraid_mark_7 {
  animation: mark_7 1.5s ease infinite;
}

@keyframes mark_2 {
  50% {
    transform: translateY(-40px);
  }
  100% {
    transform: translateY(0);
  }
}
@keyframes mark_3 {
  50% {
    transform: translateY(-62px);
  }
  100% {
    transform: translateY(0);
  }
}
@keyframes mark_6 {
  50% {
    transform: translateY(40px);
  }
  100% {
    transform: translateY(0);
  }
}
@keyframes mark_7 {
  50% {
    transform: translateY(62px);
  }
  100% {
    transform: translateY(0);
  }
}
</style>
