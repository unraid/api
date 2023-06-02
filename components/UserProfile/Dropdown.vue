<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { useDropdownStore } from '~/store/dropdown';
import { usePromoStore } from '~/store/promo';
import { useServerStore } from '~/store/server';

const { dropdownVisible } = storeToRefs(useDropdownStore());
const { promoVisible } = storeToRefs(usePromoStore());
const { pluginInstalled, registered } = storeToRefs(useServerStore());

const showDefaultContent = computed(() => !showLaunchpad.value && !promoVisible.value);
const showLaunchpad = computed(() => pluginInstalled.value && !registered.value);
/**
 * @todo use gsap to animate width between the three dropdown variants
 */
</script>

<template>
  <UpcDropdownWrapper v-if="dropdownVisible" class="DropdownWrapper_blip text-beta absolute z-30 top-full right-0 transition-all">
    <UpcDropdownContent v-if="showDefaultContent" />
    <UpcDropdownPromo v-else-if="promoVisible" />
    <UpcDropdownLaunchpad v-else />
  </UpcDropdownWrapper>
</template>
