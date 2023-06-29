<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { InformationCircleIcon } from '@heroicons/vue/24/solid';
import { useAccountStore } from '~/store/account';
import { useServerStore } from '~/store/server';
import { CONNECT_FORUMS } from '~/helpers/urls';
import type { UserProfileLink } from '~/types/userProfile';

const accountStore = useAccountStore();
const { stateData } = storeToRefs(useServerStore());
const links = ref<UserProfileLink[]>([
  // {
  //   click: () => accountStore.troubleshoot(),
  //   external: true,
  //   icon: InformationCircleIcon,
  //   text: 'Placeholder Button',
  // },
  // {
  //   external: true,
  //   href: CONNECT_FORUMS,
  //   icon: InformationCircleIcon,
  //   text: 'Connect Support Forum',
  // },
]);
</script>

<template>
  <ul v-if="stateData.error" class="text-white bg-unraid-red/90 font-semibold list-reset flex flex-col gap-y-4px mb-4px py-12px px-16px rounded">
    <h3 class="text-18px">{{ stateData.heading }}</h3>
    <p class="text-14px">{{ stateData.message }}</p>
    <template v-if="links">
      <li v-for="(link, index) in links" :key="`link_${index}`" class="-mx-8px">
        <UpcDropdownItem :item="link" class="text-white" />
      </li>
    </template>
  </ul>
</template>
