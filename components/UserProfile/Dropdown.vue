<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';
import { storeToRefs } from 'pinia';

import { useDropdownStore } from '~/store/dropdown';
import { useServerStore } from '~/store/server';

const dropdownStore = useDropdownStore()
const { dropdownVisible } = storeToRefs(dropdownStore);
const { pluginInstalled, registered } = storeToRefs(useServerStore());

const showDefaultContent = computed(() => !showLaunchpad.value);
const showLaunchpad = computed(() => pluginInstalled.value && !registered.value);
/**
 * @todo use gsap to animate width between the three dropdown variants
 */
</script>

<template>
  <UpcDropdownWrapper v-if="dropdownVisible" class="DropdownWrapper_blip text-beta absolute z-30 top-full right-0 transition-all">
    <UpcDropdownContent v-if="showDefaultContent" />
    <UpcDropdownLaunchpad v-else />
  </UpcDropdownWrapper>
</template>
