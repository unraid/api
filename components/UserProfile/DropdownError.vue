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
  <ul v-if="stateData.error" class="list-reset flex flex-col gap-y-4px p-12px -mx-4px bg-red/20">
    <h3>{{ stateData.error.heading }}</h3>
    <p>{{ stateData.error.message }}</p>
    <li v-for="(link, index) in links" :key="`link_${index}`" class="-mx-8px">
      <UpcDropdownItem :item="link" />
    </li>
  </ul>
</template>