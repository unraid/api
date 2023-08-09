<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

import { useCallbackActionsStore } from '~/store/callbackActions';
import { useTrialStore } from '~/store/trial';

const { t } = useI18n();

const { callbackStatus } = storeToRefs(useCallbackActionsStore());
const { trialModalVisible } = storeToRefs(useTrialStore());
// import { usePromoStore } from '~/store/promo';
// const { promoVisible } = storeToRefs(usePromoStore());
// <UpcPromo :t="t" :open="promoVisible" />
</script>

<template>
  <div class="relative z-[99999]">
    <UpcCallbackFeedback :t="t" :open="callbackStatus !== 'ready'" />
    <UpcTrial :t="t" :open="trialModalVisible" />
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;

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

@tailwind utilities;
</style>
