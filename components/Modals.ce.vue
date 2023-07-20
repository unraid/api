<script setup lang="ts">
import { storeToRefs } from 'pinia';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

import { useCallbackActionsStore } from '~/store/callbackActions';
import { usePromoStore } from '~/store/promo';
import { useTrialStore } from '~/store/trial';

const { callbackStatus } = storeToRefs(useCallbackActionsStore());
const { promoVisible } = storeToRefs(usePromoStore());
const { trialModalVisible } = storeToRefs(useTrialStore());
</script>

<template>
  <div class="relative z-[99999]">
    <UpcCallbackFeedback :open="callbackStatus !== 'ready'" />
    <UpcPromo :open="promoVisible" />
    <UpcTrial :open="trialModalVisible" />
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
