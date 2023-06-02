<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { useServerStore } from '~/store/server';

const { pluginInstalled, registered } = storeToRefs(useServerStore());

const showLaunchpad = computed(() => {
  return pluginInstalled.value && !registered.value;
});
</script>

<template>
  <UpcDropdownWrapper class="DropdownWrapper_blip text-beta absolute z-30 top-full right-0">
    <UpcDropdownContent v-if="!showLaunchpad" />
    <UpcDropdownLaunchpad v-else />
  </UpcDropdownWrapper>
</template>
