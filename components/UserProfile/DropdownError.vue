<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { InformationCircleIcon } from '@heroicons/vue/24/solid';
import { useServerStore } from '~/store/server';
import type { UserProfileLink } from '~/types/userProfile';

const { stateData } = storeToRefs(useServerStore());
const links = ref<UserProfileLink[]>([
  {
    click: () => console.debug('Placeholder Button'),
    external: true,
    icon: InformationCircleIcon,
    text: 'Placeholder Button',
  },
  {
    click: () => console.debug('Support Button'),
    external: true,
    icon: InformationCircleIcon,
    text: 'Support Button',
  },
]);
</script>

<template>
  <ul v-if="stateData.error" class="list-reset flex flex-col gap-y-4px -mx-8px p-12px bg-red/40 rounded">
    <h3 class="text-18px">{{ stateData.heading }}</h3>
    <p class="text-14px opacity-85">{{ stateData.message }}</p>
    <li v-for="(link, index) in links" :key="`link_${index}`" class="-mx-">
      <UpcDropdownItem :item="link" />
    </li>
  </ul>
</template>