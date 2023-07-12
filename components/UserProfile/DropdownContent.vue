<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ArrowTopRightOnSquareIcon, CogIcon, InformationCircleIcon, } from '@heroicons/vue/24/solid';

import { ACCOUNT, CONNECT_DASHBOARD, PLUGIN_SETTINGS } from '~/helpers/urls';
import { usePromoStore } from '~/store/promo';
import { useServerStore } from '~/store/server';
import type { UserProfileLink } from '~/types/userProfile';

const myServersEnv = ref<string>('Staging');
const devEnv = ref<string>('development');

const promoStore = usePromoStore();
const { keyActions, pluginInstalled, registered, stateData } = storeToRefs(useServerStore());

const signInAction = computed(() => stateData.value.actions?.filter((act: { name: string; }) => act.name === 'signIn') ?? []);
const signOutAction = computed(() => stateData.value.actions?.filter((act: { name: string; }) => act.name === 'signOut') ?? []);

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
        ...(signOutAction.value),
      ]
      : []
    ),
    ...(!registered.value && pluginInstalled.value
      ? [
        ...(signInAction.value),
      ]
      : []
    ),
    ...(!pluginInstalled.value
      ? [
        {
          click: () => {
            promoStore.promoShow();
          },
          icon: InformationCircleIcon,
          text: 'Enhance your Unraid experience with Connect',
          title: 'Enhance your Unraid experience with Connect',
        },
      ]
      : []
    ),
  ];
});
</script>

<template>
  <div class="flex flex-col gap-y-8px min-w-300px max-w-350px">
    <header v-if="pluginInstalled" class="flex flex-row items-center justify-between mt-8px mx-8px">
      <h2 class="text-18px leading-none flex flex-row gap-x-8px items-center justify-between">
        <BrandLogoConnect gradient-start="currentcolor" gradient-stop="currentcolor" class="text-beta w-[120px]" />
        <UpcBeta />
      </h2>
      <span v-if="myServersEnv || devEnv" class="flex gap-x-4px cursor-default">
        <span v-if="myServersEnv" class="text-10px" :title="`API • ${myServersEnv}`">⚙️</span>
        <span v-if="devEnv" class="text-10px" :title="`UPC • ${devEnv}`">⚠️</span>
      </span>
    </header>
    <ul class="list-reset flex flex-col gap-y-4px p-0">
      <UpcDropdownError />
      <UpcDropdownConnectStatus v-if="!stateData.error && registered && pluginInstalled" class="mt-8px" />

      <li class="m-8px">
        <UpcKeyline />
      </li>

      <template v-if="keyActions">
        <li v-for="action in keyActions" :key="action.name">
          <UpcDropdownItem :item="action" />
        </li>
      </template>

      <template v-if="links">
        <li v-for="(link, index) in links" :key="`link_${index}`">
          <UpcDropdownItem :item="link" />
        </li>
      </template>
    </ul>
  </div>
</template>
