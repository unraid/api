<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { usePromoStore } from '~/store/promo';
import { useServerStore } from '~/store/server';

const { visible } = storeToRefs(usePromoStore());
const { pluginInstalled, registered } = storeToRefs(useServerStore());

const showLaunchpad = computed(() => {
  return pluginInstalled.value && !registered.value;
});

/**
 * @todo use gsap to animate width between the three dropdown variants
 */
</script>

<template>
  <UpcDropdownWrapper class="DropdownWrapper_blip text-beta absolute z-30 top-full right-0 transition-all">
    <UpcDropdownContent v-if="!showLaunchpad && !visible" />
    <UpcDropdownPromo v-else-if="visible" />
    <UpcDropdownLaunchpad v-else />
  </UpcDropdownWrapper>
</template>
