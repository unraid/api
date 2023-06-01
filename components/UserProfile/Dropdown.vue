<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ArrowRightOnRectangleIcon, ArrowTopRightOnSquareIcon, CogIcon, InformationCircleIcon, UserIcon } from '@heroicons/vue/24/solid';

import { ACCOUNT, CONNECT_DASHBOARD, PLUGIN_SETTINGS } from '~/helpers/urls';
import { useServerStore } from '~/store/server';
import type { ServerStateDataAction } from '~/types/server';
import type { UserProfileLink } from '~/types/userProfile';

const myServersEnv = ref<string>('Staging');
const devEnv = ref<string>('development');

const serverStore = useServerStore();
const { pluginInstalled, registered, stateData } = storeToRefs(serverStore);

// Intended to hide sign in and sign out from actions v-for in UPC dropdown so we can display them separately
const stateDataKeyActions = computed((): ServerStateDataAction[] | undefined => {
  const notAllowed = ['signIn', 'signOut'];
  if (!stateData.value.actions) return;
  return stateData.value.actions.filter(action => !notAllowed.includes(action.name));
});

console.log('[registered]', registered.value);

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
          click: () => { console.debug('promo') },
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
  <UpcDropdownWrapper class="DropdownWrapper_blip text-beta absolute z-30 top-full right-0 min-w-300px max-w-350px">
    <header class="flex flex-row items-start justify-between mt-8px mx-8px">
      <h3 class="text-18px leading-none inline-flex flex-row gap-x-8px items-center">
        <span class="font-semibold">Connect</span>
        <UpcBeta />
        <span v-if="myServersEnv" :title="`API • ${myServersEnv}`">⚙️</span>
        <span v-if="devEnv" :title="`UPC • ${devEnv}`">⚠️</span>
      </h3>
    </header>
    <ul class="list-reset flex flex-col gap-y-4px p-0">
      <template v-if="stateDataKeyActions">
        <li v-for="action in stateDataKeyActions" :key="action.name">
          <UpcDropdownItem :item="action" />
        </li>
      </template>

      <li class="m-8px">
        <UpcKeyline />
      </li>

      <template v-if="links">
        <li v-for="(link, index) in links" :key="`link_${index}`">
          <UpcDropdownItem :item="link" />
        </li>
      </template>
    </ul>
  </UpcDropdownWrapper>
</template>
