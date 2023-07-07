<script setup lang="ts">
import { storeToRefs } from 'pinia';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

import { useCallbackActionsStore } from '~/store/callbackActions';
import { usePromoStore } from '~/store/promo';
import { useTrialStore } from '~/store/trial';

const { callbackStatus } = storeToRefs(useCallbackActionsStore());
const { promoVisible } = storeToRefs(usePromoStore());
const { trialStatus } = storeToRefs(useTrialStore());
</script>

<template>
  <div class="relative z-[99999]">
    <UpcCallbackFeedback :open="callbackStatus !== 'ready'" />
    <UpcPromo :open="promoVisible" />
    <UpcTrial :open="trialStatus === 'requestNew' || trialStatus === 'failed'" />
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
