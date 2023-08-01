<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

import { useCallbackActionsStore } from '~/store/callbackActions';
import { usePromoStore } from '~/store/promo';
import { useTrialStore } from '~/store/trial';

const { t } = useI18n();

const { callbackStatus } = storeToRefs(useCallbackActionsStore());
const { promoVisible } = storeToRefs(usePromoStore());
const { trialModalVisible } = storeToRefs(useTrialStore());
</script>

<template>
  <div class="relative z-[99999]">
    <UpcCallbackFeedback :t="t" :open="callbackStatus !== 'ready'" />
    <UpcPromo :t="t" :open="promoVisible" />
    <UpcTrial :t="t" :open="trialModalVisible" />
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
