<script setup lang="ts">
import { storeToRefs } from 'pinia';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

import { useCallbackActionsStore } from '~/store/callbackActions';
import { usePromoStore } from '~/store/promo';

const { callbackStatus } = storeToRefs(useCallbackActionsStore());
const { promoVisible } = storeToRefs(usePromoStore());
</script>

<template>
  <div class="relative z-[99999]">
    <UpcCallbackFeedback :open="callbackStatus !== 'ready'" />
    <UpcPromo :open="promoVisible" />
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
