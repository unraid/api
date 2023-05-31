<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ArrowRightOnRectangleIcon, ArrowTopRightOnSquareIcon, CogIcon } from '@heroicons/vue/24/solid';

import { ACCOUNT, CONNECT_DASHBOARD, PLUGIN_SETTINGS } from '~/helpers/urls';
import { useServerStore } from '~/store/server';
import type { ServerStateDataAction } from '~/types/server';
import type { UserProfileLink } from '~/types/userProfile';

const myServersEnv = ref<string>('Staging');
const devEnv = ref<string>('development');

const serverStore = useServerStore();
const { registered, stateData } = storeToRefs(serverStore);

// Intended to hide sign in and sign out from actions v-for in UPC dropdown so we can display them separately
const stateDataKeyActions = computed((): ServerStateDataAction[] | undefined => {
  const notAllowed = ['signIn', 'signOut'];
  if (!stateData.value.actions) return;
  return stateData.value.actions.filter(action => !notAllowed.includes(action.name));
});

console.log('[registered]', registered.value);

const links = computed(():UserProfileLink[] => {
  return [
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
    ...(registered.value
      ? [{
        click: () => { console.debug('signOut') },
        icon: ArrowRightOnRectangleIcon,
        text: 'Sign Out',
        title: 'Sign Out to Unregister your server with Connect',
      }]
      : []
    ),
  ];
})
</script>

<template>
  <upc-dropdown-wrapper class="Dropdown min-w-300px max-w-350px">
    <header class="flex flex-row items-start justify-between mt-8px mx-8px">
      <h3 class="text-18px leading-none inline-flex flex-row gap-x-8px items-center">
        <span class="font-semibold">Connect</span>
        <upc-beta />
        <span v-if="myServersEnv" :title="`API • ${myServersEnv}`">⚙️</span>
        <span v-if="devEnv" :title="`UPC • ${devEnv}`">⚠️</span>
      </h3>
    </header>
    <ul class="list-reset flex flex-col gap-y-4px p-0">
      <template v-if="stateDataKeyActions">
        <li v-for="action in stateDataKeyActions" :key="action.name">
          <upc-dropdown-item :item="action" />
        </li>
      </template>

      <li class="m-8px">
        <upc-keyline />
      </li>

      <template v-if="links">
        <li v-for="(link, index) in links" :key="`link_${index}`">
          <upc-dropdown-item :item="link" />
        </li>
      </template>
    </ul>
  </upc-dropdown-wrapper>
</template>

<style lang="postcss" scoped>
.Dropdown {
  @apply text-beta;

  top: 95%;
  box-shadow: var(--ring-offset-shadow), var(--ring-shadow), var(--shadow-beta);

  &::before {
    @apply absolute z-20 block;

    content: '';
    width: 0;
    height: 0;
    top: -10px;
    right: 32px;
    border-right: 11px solid transparent;
    border-bottom: 11px solid var(--color-alpha);
    border-left: 11px solid transparent;
  }
}
</style>
