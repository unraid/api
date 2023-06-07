<script setup lang="ts">
import { storeToRefs } from 'pinia';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

import { useCallbackStore } from '~/store/callback';
import { usePromoStore } from '~/store/promo';

const callbackStore = useCallbackStore();
const promoStore = usePromoStore();
const { callbackFeedbackVisible } = storeToRefs(callbackStore);
const { promoVisible } = storeToRefs(promoStore);
</script>

<template>
  <div class="relative z-[99999]">
    <UpcCallbackFeedback :open="callbackFeedbackVisible" />
    <UpcPromo :open="promoVisible" />
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
