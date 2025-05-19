<script setup lang="ts">
import { storeToRefs } from 'pinia';

import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BellAlertIcon,
  CogIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  UserIcon,
} from '@heroicons/vue/24/solid';
import { BrandLogoConnect } from '@unraid/ui';
import {
  CONNECT_DASHBOARD,
  WEBGUI_CONNECT_SETTINGS,
  WEBGUI_TOOLS_DOWNGRADE,
  WEBGUI_TOOLS_REGISTRATION,
  WEBGUI_TOOLS_UPDATE,
} from '~/helpers/urls';

import type { UserProfileLink } from '~/types/userProfile';
import { useI18n } from '~/composables/useI18n';

import { useAccountStore } from '~/store/account';
import { useErrorsStore } from '~/store/errors';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';

const { $t } = useI18n();

const accountStore = useAccountStore();
const errorsStore = useErrorsStore();
const updateOsStore = useUpdateOsStore();

const { errors } = storeToRefs(errorsStore);
const {
  keyActions,
  connectPluginInstalled,
  rebootType,
  registered,
  regUpdatesExpired,
  stateData,
  stateDataError,
} = storeToRefs(useServerStore());
const { available: osUpdateAvailable, availableWithRenewal: osUpdateAvailableWithRenewal } =
  storeToRefs(updateOsStore);

const signInAction = computed(
  () => stateData.value.actions?.filter((act: { name: string }) => act.name === 'signIn') ?? []
);
const signOutAction = computed(
  () => stateData.value.actions?.filter((act: { name: string }) => act.name === 'signOut') ?? []
);

/**
 * Filter out the renew action from the key actions so we can display it separately and link to the Tools > Registration page
 */
const filteredKeyActions = computed(() =>
  keyActions.value?.filter((action) => !['renew'].includes(action.name))
);

const manageUnraidNetAccount = computed((): UserProfileLink => {
  return {
    external: true,
    click: () => {
      accountStore.manage();
    },
    icon: UserIcon,
    text: $t('Manage Unraid.net Account'),
    title: $t('Manage Unraid.net Account in new tab'),
  };
});

const updateOsCheckForUpdatesButton = computed((): UserProfileLink => {
  return {
    click: () => {
      updateOsStore.localCheckForUpdate();
    },
    icon: ArrowPathIcon,
    text: $t('Check for Update'),
  };
});
const updateOsResponseModalOpenButton = computed((): UserProfileLink => {
  return {
    click: () => {
      updateOsStore.setModalOpen(true);
    },
    emphasize: true,
    icon: BellAlertIcon,
    text: osUpdateAvailableWithRenewal.value
      ? $t('Unraid OS {0} Released', [osUpdateAvailableWithRenewal.value])
      : $t('Unraid OS {0} Update Available', [osUpdateAvailable.value]),
  };
});
const rebootDetectedButton = computed((): UserProfileLink => {
  return {
    href:
      rebootType.value === 'downgrade'
        ? WEBGUI_TOOLS_DOWNGRADE.toString()
        : WEBGUI_TOOLS_UPDATE.toString(),
    icon: ExclamationTriangleIcon,
    text:
      rebootType.value === 'downgrade'
        ? $t('Reboot Required for Downgrade')
        : $t('Reboot Required for Update'),
  };
});

const updateOsButton = computed((): UserProfileLink[] => {
  const btns = [];
  if (rebootType.value === 'downgrade' || rebootType.value === 'update') {
    btns.push(rebootDetectedButton.value);
    return btns;
  }

  if (osUpdateAvailable.value) {
    btns.push(updateOsResponseModalOpenButton.value);
  } else {
    btns.push(updateOsCheckForUpdatesButton.value);
  }
  return btns;
});

const links = computed((): UserProfileLink[] => {
  return [
    ...(regUpdatesExpired.value
      ? [
          {
            href: WEBGUI_TOOLS_REGISTRATION.toString(),
            icon: KeyIcon,
            text: $t('OS Update Eligibility Expired'),
            title: $t('Go to Tools > Registration to Learn More'),
          },
        ]
      : []),

    // ensure we only show the update button when we don't have an error
    ...(!stateDataError.value ? [...updateOsButton.value] : []),

    // connect plugin links
    ...(registered.value && connectPluginInstalled.value
      ? [
          {
            emphasize: !osUpdateAvailable.value, // only emphasize when we don't have an update available
            external: true,
            href: CONNECT_DASHBOARD.toString(),
            icon: ArrowTopRightOnSquareIcon,
            text: $t('Go to Connect'),
            title: $t('Opens Connect in new tab'),
          },
          ...[manageUnraidNetAccount.value],
          {
            href: WEBGUI_CONNECT_SETTINGS.toString(),
            icon: CogIcon,
            text: $t('Settings'),
            title: $t('Go to Connect plugin settings'),
          },
          ...signOutAction.value,
        ]
      : [...[manageUnraidNetAccount.value]]),
  ];
});

const showErrors = computed(() => errors.value.length);
const showConnectStatus = computed(
  () => !showErrors.value && !stateData.value.error && registered.value && connectPluginInstalled.value
);
const showKeyline = computed(
  () =>
    (showConnectStatus.value && (keyActions.value?.length || links.value.length)) ||
    unraidConnectWelcome.value
);

const unraidConnectWelcome = computed(() => {
  if (
    connectPluginInstalled.value &&
    !registered.value &&
    !errors.value.length &&
    !stateDataError.value
  ) {
    return {
      heading: $t('Thank you for installing Connect!'),
      message: $t('Sign In to your Unraid.net account to get started'),
    };
  }
  return undefined;
});
</script>

<template>
  <div class="flex flex-col grow gap-y-8px">
    <header
      v-if="connectPluginInstalled"
      class="flex flex-col items-start justify-between mt-8px mx-8px"
    >
      <h2 class="text-18px leading-none flex flex-row gap-x-4px items-center justify-between">
        <BrandLogoConnect
          gradient-start="currentcolor"
          gradient-stop="currentcolor"
          class="text-foreground w-[120px]"
        />
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
      <UpcDropdownConnectStatus v-if="showConnectStatus" />
      <UpcDropdownError v-if="showErrors" />

      <li v-if="showKeyline" class="my-8px">
        <UpcKeyline />
      </li>

      <li v-if="!registered && connectPluginInstalled">
        <UpcDropdownItem :item="signInAction[0]" />
      </li>

      <template v-if="filteredKeyActions">
        <li v-for="action in filteredKeyActions" :key="action.name">
          <UpcDropdownItem :item="action" />
        </li>
      </template>

      <template v-if="links.length">
        <li v-for="(link, index) in links" :key="`link_${index}`">
          <UpcDropdownItem :item="link" />
        </li>
      </template>
    </ul>
  </div>
</template>
