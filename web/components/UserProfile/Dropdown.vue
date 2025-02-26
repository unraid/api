<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { TransitionRoot } from '@headlessui/vue';

import type { ComposerTranslation } from 'vue-i18n';

import { useDropdownStore } from '~/store/dropdown';
import { useServerStore } from '~/store/server';

defineProps<{ t: ComposerTranslation }>();

const dropdownStore = useDropdownStore();

const { dropdownVisible } = storeToRefs(dropdownStore);
const { state } = storeToRefs(useServerStore());

const showLaunchpad = computed(() => state.value === 'ENOKEYFILE');
</script>

<template>
  <TransitionRoot
    :show="dropdownVisible"
    enter="transition-all duration-200"
    enter-from="opacity-0 translate-y-[16px]"
    enter-to="opacity-100"
    leave="transition-all duration-150"
    leave-from="opacity-100"
    leave-to="opacity-0 translate-y-[16px]"
  >
    <UpcDropdownWrapper
      class="DropdownWrapper_blip text-foreground absolute z-30 top-full right-0 transition-all"
    >
      <UpcDropdownLaunchpad v-if="showLaunchpad" :t="t" />
      <UpcDropdownContent v-else :t="t" />
    </UpcDropdownWrapper>
  </TransitionRoot>
</template>
