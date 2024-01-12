<script setup lang="ts">
import { storeToRefs } from 'pinia';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BellAlertIcon,
  CogIcon,
  KeyIcon,
} from '@heroicons/vue/24/solid';

import {
  ACCOUNT,
  CONNECT_DASHBOARD,
  WEBGUI_CONNECT_SETTINGS,
  WEBGUI_TOOLS_REGISTRATION,
} from '~/helpers/urls';
import { useErrorsStore } from '~/store/errors';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';
import type { UserProfileLink } from '~/types/userProfile';

const props = defineProps<{ t: any; }>();

const errorsStore = useErrorsStore();
const updateOsStore = useUpdateOsStore();
const updateOsActionsStore = useUpdateOsActionsStore();

const { errors } = storeToRefs(errorsStore);
const {
  keyActions,
  connectPluginInstalled,
  registered,
  regUpdatesExpired,
  stateData,
  stateDataError,
} = storeToRefs(useServerStore());
const { available: osUpdateAvailable } = storeToRefs(updateOsStore);

const signInAction = computed(() => stateData.value.actions?.filter((act: { name: string; }) => act.name === 'signIn') ?? []);
const signOutAction = computed(() => stateData.value.actions?.filter((act: { name: string; }) => act.name === 'signOut') ?? []);

/**
 * Filter out the renew action from the key actions so we can display it separately and link to the Tools > Registration page
 */
const filteredKeyActions = computed(() => keyActions.value?.filter(action => !['renew'].includes(action.name)));

const links = computed(():UserProfileLink[] => {
  return [
    ...(regUpdatesExpired.value
      ? [{
          href: WEBGUI_TOOLS_REGISTRATION.toString(),
          icon: KeyIcon,
          text: props.t('OS Update Eligibility Expired'),
          title: props.t('Go to Tools > Registration to Learn More'),
        }]
      : []),
    // @todo - conditional determine button here

    // otherwise we should have a button to check for updates
    ...(osUpdateAvailable.value
      ? [
          {
            click: () => {
              updateOsStore.setModalOpen(true);
            },
            emphasize: true,
            icon: BellAlertIcon,
            text: props.t('Unraid OS {0} Update Available', [osUpdateAvailable.value]),
          },
        ]
      : [
        // if available we should have a button to open the modal
          {
            click: () => {
              updateOsStore.localCheckForUpdate();
            },
            icon: ArrowPathIcon,
            text: props.t('Check for Update'),
          },
          // account callback button
          updateOsActionsStore.updateCallbackButton(),
        ]),
    // connect plugin links
    ...(registered.value && connectPluginInstalled.value
      ? [
          {
            emphasize: !osUpdateAvailable.value, // only emphasize when we don't have an update available
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
            href: WEBGUI_CONNECT_SETTINGS.toString(),
            icon: CogIcon,
            text: props.t('Settings'),
            title: props.t('Go to Connect plugin settings'),
          },
          ...(signOutAction.value),
        ]
      : []
    ),
  ];
});

const showErrors = computed(() => errors.value.length);
const showConnectStatus = computed(() => !showErrors.value && !stateData.value.error && registered.value && connectPluginInstalled.value);
const showKeyline = computed(() =>
  (showConnectStatus.value && (keyActions.value?.length || links.value.length)) ||
  unraidConnectWelcome.value
);

const unraidConnectWelcome = computed(() => {
  if (connectPluginInstalled.value && !registered.value && !errors.value.length && !stateDataError.value) {
    return {
      heading: props.t('Thank you for installing Connect!'),
      message: props.t('Sign In to your Unraid.net account to get started'),
    };
  }
  return undefined;
});
</script>

<template>
  <div class="flex flex-col gap-y-8px min-w-300px max-w-350px">
    <header v-if="connectPluginInstalled" class="flex flex-col items-start justify-between mt-8px mx-8px">
      <h2 class="text-18px leading-none flex flex-row gap-x-4px items-center justify-between">
        <BrandLogoConnect gradient-start="currentcolor" gradient-stop="currentcolor" class="text-beta w-[120px]" />
        <UpcBeta />
      </h2>
      <template v-if="unraidConnectWelcome">
        <h3 class="text-16px font-semibold mt-2">
          {{ unraidConnectWelcome.heading }}
        </h3>
        <p class="text-14px">
          {{ unraidConnectWelcome.message }}
        </p>
      </template>
    </header>
    <ul class="list-reset flex flex-col gap-y-4px p-0">
      <UpcDropdownConnectStatus v-if="showConnectStatus" :t="t" />
      <UpcDropdownError v-if="showErrors" :t="t" />

      <li v-if="showKeyline" class="my-8px">
        <UpcKeyline />
      </li>

      <li v-if="!registered && connectPluginInstalled">
        <UpcDropdownItem :item="signInAction[0]" :t="t" />
      </li>

      <template v-if="filteredKeyActions">
        <li v-for="action in filteredKeyActions" :key="action.name">
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
