<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
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

import Beta from '~/components/UserProfile/Beta.vue';
import DropdownConnectStatus from '~/components/UserProfile/DropdownConnectStatus.vue';
import DropdownError from '~/components/UserProfile/DropdownError.vue';
import DropdownItem from '~/components/UserProfile/DropdownItem.vue';
import Keyline from '~/components/UserProfile/Keyline.vue';
import { useAccountStore } from '~/store/account';
import { useErrorsStore } from '~/store/errors';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';

const { t } = useI18n();

const emit = defineEmits<{
  'close-dropdown': [];
}>();

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
      emit('close-dropdown');
    },
    icon: UserIcon,
    text: t('userProfile.dropdownContent.manageUnraidNetAccount'),
    title: t('userProfile.dropdownContent.manageUnraidNetAccountInNew'),
  };
});

const updateOsCheckForUpdatesButton = computed((): UserProfileLink => {
  return {
    click: () => {
      updateOsStore.localCheckForUpdate();
      emit('close-dropdown');
    },
    icon: ArrowPathIcon,
    text: t('userProfile.dropdownContent.checkForUpdate'),
  };
});
const updateOsResponseModalOpenButton = computed((): UserProfileLink => {
  return {
    click: () => {
      updateOsStore.setModalOpen(true);
      emit('close-dropdown');
    },
    emphasize: true,
    icon: BellAlertIcon,
    text: osUpdateAvailableWithRenewal.value
      ? t('headerOsVersion.unraidOsReleased', [osUpdateAvailableWithRenewal.value])
      : t('headerOsVersion.unraidOsUpdateAvailable', [osUpdateAvailable.value]),
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
        ? t('userProfile.dropdownContent.rebootRequiredForDowngrade')
        : t('userProfile.dropdownContent.rebootRequiredForUpdate'),
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
            text: t('userProfile.dropdownContent.osUpdateEligibilityExpired'),
            title: t('registration.general.goToToolsRegistrationToLearn'),
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
            text: t('connect.general.goToConnect'),
            title: t('userProfile.dropdownContent.opensConnectInNewTab'),
          },
          ...[manageUnraidNetAccount.value],
          ...signOutAction.value,
        ]
      : [...[manageUnraidNetAccount.value]]),
    {
      href: WEBGUI_CONNECT_SETTINGS.toString(),
      icon: CogIcon,
      text: t('userProfile.dropdownContent.settings'),
      title: t('userProfile.dropdownContent.goToApiSettings'),
    },
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
      heading: t('userProfile.dropdownContent.thankYouForInstallingConnect'),
      message: t('userProfile.dropdownContent.signInToYourUnraidNet'),
    };
  }
  return undefined;
});
</script>

<template>
  <div class="flex grow flex-col gap-y-2">
    <header
      v-if="connectPluginInstalled"
      class="mx-2 mt-2 flex flex-col items-start justify-between gap-2"
    >
      <h2 class="flex flex-row items-center justify-between gap-x-1 text-lg leading-none">
        <BrandLogoConnect
          gradient-start="currentcolor"
          gradient-stop="currentcolor"
          class="text-foreground w-[120px]"
        />
        <Beta />
      </h2>
      <template v-if="unraidConnectWelcome">
        <h3 class="mt-2 text-base font-semibold">
          {{ unraidConnectWelcome.heading }}
        </h3>
        <p class="text-sm">
          {{ unraidConnectWelcome.message }}
        </p>
      </template>
    </header>
    <ul class="list-reset flex flex-col gap-y-1 p-0">
      <DropdownConnectStatus v-if="showConnectStatus" />
      <DropdownError v-if="showErrors" />

      <li v-if="showKeyline" class="my-2">
        <Keyline />
      </li>

      <li v-if="!registered && connectPluginInstalled">
        <DropdownItem :item="signInAction[0]" />
      </li>

      <template v-if="filteredKeyActions">
        <li v-for="action in filteredKeyActions" :key="action.name">
          <DropdownItem :item="action" />
        </li>
      </template>

      <template v-if="links.length">
        <li v-for="(link, index) in links" :key="`link_${index}`">
          <DropdownItem :item="link" />
        </li>
      </template>
    </ul>
  </div>
</template>
