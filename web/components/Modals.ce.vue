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
@tailwind utilities;
</style>
