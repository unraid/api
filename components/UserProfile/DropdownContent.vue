<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ArrowTopRightOnSquareIcon, CogIcon } from '@heroicons/vue/24/solid';

import { ACCOUNT, CONNECT_DASHBOARD, PLUGIN_SETTINGS } from '~/helpers/urls';
import { useErrorsStore } from '~/store/errors';
// import { usePromoStore } from '~/store/promo';
import { useServerStore } from '~/store/server';
import type { UserProfileLink } from '~/types/userProfile';

const props = defineProps<{ t: any; }>();

const errorsStore = useErrorsStore();
// const promoStore = usePromoStore();

const { keyActions, connectPluginInstalled, registered, stateData } = storeToRefs(useServerStore());
const { errors } = storeToRefs(errorsStore);

const signInAction = computed(() => stateData.value.actions?.filter((act: { name: string; }) => act.name === 'signIn') ?? []);
const signOutAction = computed(() => stateData.value.actions?.filter((act: { name: string; }) => act.name === 'signOut') ?? []);

const links = computed(():UserProfileLink[] => {
  return [
    ...(registered.value && connectPluginInstalled.value
      ? [
          {
            emphasize: true,
            external: true,
            href: CONNECT_DASHBOARD.toString(),
            icon: ArrowTopRightOnSquareIcon,
            text: props.t('Go to Connect'),
            title: props.t('Opens Connect in new tab'),
          },
          {
            external: true,
            href: ACCOUNT.toString(),
            icon: ArrowTopRightOnSquareIcon,
            text: props.t('Manage Unraid.net Account'),
            title: props.t('Manage Unraid.net Account in new tab'),
          },
          {
            href: PLUGIN_SETTINGS.toString(),
            icon: CogIcon,
            text: props.t('Settings'),
            title: props.t('Go to Connect plugin settings'),
          },
          ...(signOutAction.value),
        ]
      : []
    ),
    ...(!registered.value && connectPluginInstalled.value
      ? [
          ...(signInAction.value),
        ]
      : []
    ),
    // ...(!connectPluginInstalled.value
    //   ? [
    //       {
    //         click: () => {
    //           promoStore.promoShow();
    //         },
    //         icon: InformationCircleIcon,
    //         text: props.t('Enhance your Unraid experience with Connect'),
    //         title: props.t('Enhance your Unraid experience with Connect'),
    //       },
    //     ]
    //   : []
    // ),
  ];
});

const showErrors = computed(() => errors.value.length);
const showConnectStatus = computed(() => !showErrors.value && !stateData.value.error && registered.value && connectPluginInstalled.value);
const showKeyline = computed(() => showConnectStatus.value && (keyActions.value?.length || links.value.length));
</script>

<template>
  <div class="flex flex-col gap-y-8px min-w-300px max-w-350px">
    <header v-if="connectPluginInstalled" class="flex flex-row items-center justify-between mt-8px mx-8px">
      <h2 class="text-18px leading-none flex flex-row gap-x-8px items-center justify-between">
        <BrandLogoConnect gradient-start="currentcolor" gradient-stop="currentcolor" class="text-beta w-[120px]" />
        <UpcBeta />
      </h2>
    </header>
    <ul class="list-reset flex flex-col gap-y-4px p-0">
      <UpcDropdownConnectStatus v-if="showConnectStatus" :t="t" />
      <UpcDropdownError v-if="showErrors" :t="t" />

      <li v-if="showKeyline" class="my-8px">
        <UpcKeyline />
      </li>

      <template v-if="keyActions">
        <li v-for="action in keyActions" :key="action.name">
          <UpcDropdownItem :item="action" :t="t" />
        </li>
      </template>

      <template v-if="links.length">
        <li v-for="(link, index) in links" :key="`link_${index}`">
          <UpcDropdownItem :item="link" :t="t" />
        </li>
      </template>
    </ul>
  </div>
</template>
