<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ArrowRightOnRectangleIcon, ArrowTopRightOnSquareIcon, CogIcon, InformationCircleIcon, UserIcon } from '@heroicons/vue/24/solid';

import { ACCOUNT, CONNECT_DASHBOARD, PLUGIN_SETTINGS } from '~/helpers/urls';
import { useDropdownStore } from '~/store/dropdown';
import { usePromoStore } from '~/store/promo';
import { useServerStore } from '~/store/server';
import type { UserProfileLink } from '~/types/userProfile';

const myServersEnv = ref<string>('Staging');
const devEnv = ref<string>('development');

const dropdownStore = useDropdownStore();
const promoStore = usePromoStore();
const { keyActions, pluginInstalled, registered, stateData } = storeToRefs(useServerStore());

const links = computed(():UserProfileLink[] => {
  return [
    ...(registered.value && pluginInstalled.value
      ? [
        {
          emphasize: true,
          external: true,
          href: CONNECT_DASHBOARD,
          icon: ArrowTopRightOnSquareIcon,
          text: 'Go to Connect',
          title: 'Opens Connect in new tab',
        },
        {
          external: true,
          href: ACCOUNT,
          icon: ArrowTopRightOnSquareIcon,
          text: 'Manage Unraid.net Account',
          title: 'Manage Unraid.net Account in new tab',
        },
        {
          href: PLUGIN_SETTINGS,
          icon: CogIcon,
          text: 'Settings',
          title: 'Go to Connect plugin settings',
        },
        {
          click: () => { console.debug('signOut') },
          external: true,
          icon: ArrowRightOnRectangleIcon,
          text: 'Sign Out',
          title: 'Sign Out to Unregister your server with Connect',
        },
      ]
      : []
    ),
    ...(!registered.value && pluginInstalled.value
      ? [
        {
          click: () => { console.debug('signIn') },
          external: true,
          icon: UserIcon,
          text: 'Sign In with Unraid.net Account',
          title: 'Sign In with Unraid.net Account',
        },
      ]
      : []
    ),
    ...(!pluginInstalled.value
      ? [
        {
          click: () => {
            promoStore.promoShow();
            dropdownStore.dropdownHide();
          },
          icon: InformationCircleIcon,
          text: 'Enhance your Unraid experience with Connect',
          title: 'Enhance your Unraid experience with Connect',
        },
      ]
      : []
    ),
  ];
})
</script>

<template>
  <div class="flex flex-col gap-y-8px min-w-300px max-w-350px">
    <header class="flex flex-row items-start justify-between mt-8px mx-8px">
      <h2 class="text-18px leading-none inline-flex flex-row gap-x-8px items-center">
        <span class="font-semibold">Connect</span>
        <UpcBeta />
        <span v-if="myServersEnv" :title="`API • ${myServersEnv}`">⚙️</span>
        <span v-if="devEnv" :title="`UPC • ${devEnv}`">⚠️</span>
      </h2>
    </header>
    <ul class="list-reset flex flex-col gap-y-4px p-0">
      <template v-if="keyActions">
        <li v-for="action in keyActions" :key="action.name">
          <UpcDropdownItem :item="action" />
        </li>
      </template>

      <li class="m-8px">
        <UpcKeyline />
      </li>

      <UpcDropdownError v-if="stateData.error" />
      <UpcDropdownConnectStatus v-else-if="registered && pluginInstalled" />

      <template v-if="links">
        <li v-for="(link, index) in links" :key="`link_${index}`">
          <UpcDropdownItem :item="link" />
        </li>
      </template>
    </ul>
  </div>
</template>
