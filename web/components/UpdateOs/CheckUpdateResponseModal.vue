<script lang="ts" setup>
import { storeToRefs } from 'pinia';

import {
  ArrowTopRightOnSquareIcon,
  CogIcon,
  EyeIcon,
  IdentificationIcon,
  KeyIcon,
  XMarkIcon,
} from '@heroicons/vue/24/solid';
import { BrandButton, BrandLoading } from '@unraid/ui';
import { Switch, SwitchGroup, SwitchLabel } from '@headlessui/vue';

import type { BrandButtonProps } from '@unraid/ui';
import type { ComposerTranslation } from 'vue-i18n';

import useDateTimeHelper from '~/composables/dateTime';
import { useAccountStore } from '~/store/account';
import { usePurchaseStore } from '~/store/purchase';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';

export interface Props {
  open?: boolean;
  t: ComposerTranslation;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
});

const accountStore = useAccountStore();
const purchaseStore = usePurchaseStore();
const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();

const {
  regExp,
  regUpdatesExpired,
  dateTimeFormat,
  updateOsIgnoredReleases,
  updateOsNotificationsEnabled,
  updateOsResponse,
} = storeToRefs(serverStore);
const {
  available,
  availableWithRenewal,
  availableReleaseDate,
  availableRequiresAuth,
  checkForUpdatesLoading,
} = storeToRefs(updateOsStore);

/**
 * regExp may not have a value until we get a response from the refreshServerState action
 * So we need to watch for this value to be able to format it based on the user's date time preferences.
 */
const formattedRegExp = ref<string>();
const setFormattedRegExp = () => {
  // ran in watch on regExp and onBeforeMount
  if (!regExp.value) {
    return;
  }

  const { outputDateTimeFormatted } = useDateTimeHelper(
    dateTimeFormat.value,
    props.t,
    true,
    regExp.value
  );
  formattedRegExp.value = outputDateTimeFormatted.value;
};
watch(regExp, (_newV) => {
  setFormattedRegExp();
});

const ignoreThisRelease = ref(false);
// if we had a release ignored and now we don't set ignoreThisRelease to false
watch(updateOsIgnoredReleases, (newVal, oldVal) => {
  if (oldVal.length > 0 && newVal.length === 0) {
    ignoreThisRelease.value = false;
  }
});

const notificationsSettings = computed(() => {
  return !updateOsNotificationsEnabled.value
    ? props.t(
        'Go to Settings > Notifications to enable automatic OS update notifications for future releases.'
      )
    : undefined;
});

interface ModalCopy {
  title: string;
  description?: string;
}
const modalCopy = computed((): ModalCopy | null => {
  if (checkForUpdatesLoading.value) {
    return {
      title: props.t('Checking for OS updates...'),
    };
  }

  // Use the release date
  let formattedReleaseDate = '';
  if (availableReleaseDate.value) {
    // build string with prefix
    formattedReleaseDate = props.t('Release date {0}', [userFormattedReleaseDate.value]);
  }

  if (availableWithRenewal.value) {
    const description = regUpdatesExpired.value
      ? `${props.t('Eligible for updates released on or before {0}.', [formattedRegExp.value])} ${props.t('Extend your license to access the latest updates.')}`
      : props.t('Eligible for free feature updates until {0}', [formattedRegExp.value]);
    return {
      title: props.t('Unraid OS {0} Released', [availableWithRenewal.value]),
      description: `<p>${formattedReleaseDate}</p><p>${description}</p>`,
    };
  } else if (available.value) {
    const description = availableRequiresAuth.value
      ? props.t('Release requires verification to update')
      : undefined;
    return {
      title: props.t('Unraid OS {0} Update Available', [available.value]),
      description: description
        ? `<p>${formattedReleaseDate}</p><p>${description}</p>`
        : formattedReleaseDate,
    };
  } else if (!available.value && !availableWithRenewal.value) {
    return {
      title: props.t('Unraid OS is up-to-date'),
      description: notificationsSettings.value ?? undefined,
    };
  }
  return null;
});

const showNotificationsSettingsLink = computed(() => {
  return !updateOsNotificationsEnabled.value && !available.value && !availableWithRenewal.value;
});

const extraLinks = computed((): BrandButtonProps[] => {
  const buttons: BrandButtonProps[] = [];

  if (showNotificationsSettingsLink.value) {
    buttons.push({
      variant: 'outline',
      href: '/Settings/Notifications',
      icon: CogIcon,
      text: props.t('Enable update notifications'),
    });
  }

  return buttons;
});

const actionButtons = computed((): BrandButtonProps[] | null => {
  // update not available or no action buttons default closing
  if (!available.value || ignoreThisRelease.value) {
    return null;
  }

  const buttons: BrandButtonProps[] = [];

  // update available but not stable branch - should link out to account update callback
  // if availableWithRenewal.value is true, then we need to renew the license before we can update so don't show the verify button
  if (availableRequiresAuth.value && !availableWithRenewal.value) {
    buttons.push({
      click: async () => await accountStore.updateOs(),
      icon: IdentificationIcon,
      text: props.t('Verify to Update'),
    });

    return buttons;
  }

  // update available - open changelog to commence update
  if (available.value && updateOsResponse.value?.changelog) {
    buttons.push({
      variant: availableWithRenewal.value ? 'outline' : undefined,
      click: async () =>
        await updateOsStore.setReleaseForUpdate(updateOsResponse.value ?? null),
      icon: EyeIcon,
      text: availableWithRenewal.value
        ? props.t('View Changelog')
        : props.t('View Changelog to Start Update'),
    });
  }

  // update available with renewal - open changelog and Extend License options
  if (availableWithRenewal.value) {
    buttons.push({
      click: async () => await purchaseStore.renew(),
      icon: KeyIcon,
      iconRight: ArrowTopRightOnSquareIcon,
      iconRightHoverDisplay: false,
      text: props.t('Extend License'),
      title: props.t('Pay your annual fee to continue receiving OS updates.'),
    });
  }

  return buttons;
});

const close = () => {
  // close it
  updateOsStore.setModalOpen(false);
  // then ignore the release if applicable
  if (ignoreThisRelease.value && (availableWithRenewal.value || available.value)) {
    setTimeout(() => {
      serverStore.updateOsIgnoreRelease(availableWithRenewal.value ?? available.value ?? '');
    }, 500);
  }
};

const renderMainSlot = computed(() => {
  return !!(
    checkForUpdatesLoading.value ||
    available.value ||
    availableWithRenewal.value ||
    extraLinks.value?.length > 0 ||
    updateOsIgnoredReleases.value.length > 0
  );
});

const userFormattedReleaseDate = ref<string>();
/**
 * availableReleaseDate may not have a value until we get a release in the update os check response.
 * So we need to watch for this value to be able to format it based on the user's date time preferences.
 */
const setUserFormattedReleaseDate = () => {
  if (!availableReleaseDate.value) {
    return;
  }

  const { outputDateTimeFormatted } = useDateTimeHelper(
    dateTimeFormat.value,
    props.t,
    true,
    availableReleaseDate.value.valueOf()
  );
  userFormattedReleaseDate.value = outputDateTimeFormatted.value;
};
watch(availableReleaseDate, (_newV) => {
  setUserFormattedReleaseDate();
});
onBeforeMount(() => {
  if (availableReleaseDate.value) {
    setUserFormattedReleaseDate();
  }
  setFormattedRegExp();
});

const modalWidth = computed(() => {
  if (availableWithRenewal.value) {
    // wider since we'll have four buttons
    return 'max-w-800px';
  }
  return 'max-w-640px';
});
</script>

<template>
  <Modal
    :t="t"
    :open="open"
    :title="modalCopy?.title"
    :description="modalCopy?.description"
    :show-close-x="!checkForUpdatesLoading"
    :max-width="modalWidth"
    @close="close"
  >
    <template v-if="renderMainSlot" #main>
      <BrandLoading v-if="checkForUpdatesLoading" class="w-[150px] mx-auto" />
      <div v-else class="flex flex-col gap-y-16px">
        <div v-if="extraLinks.length > 0" class="flex flex-col xs:flex-row justify-center gap-8px">
          <BrandButton
            v-for="item in extraLinks"
            :key="item.text"
            :btn-style="item.variant ?? undefined"
            :href="item.href ?? undefined"
            :icon="item.icon"
            :icon-right="item.iconRight"
            :icon-right-hover-display="item.iconRightHoverDisplay"
            :text="t(item.text ?? '')"
            :title="item.title ? t(item.title) : undefined"
            @click="item.click?.()"
          />
        </div>

        <div v-if="available || availableWithRenewal" class="mx-auto">
          <SwitchGroup>
            <div class="flex justify-center items-center gap-8px p-8px rounded">
              <Switch
                v-model="ignoreThisRelease"
                :class="
                  ignoreThisRelease ? 'bg-gradient-to-r from-unraid-red to-orange' : 'bg-transparent'
                "
                class="relative inline-flex h-24px w-[48px] items-center rounded-full overflow-hidden"
              >
                <span
                  v-show="!ignoreThisRelease"
                  class="absolute z-0 inset-0 opacity-10 bg-foreground"
                />
                <span
                  :class="ignoreThisRelease ? 'translate-x-[26px]' : 'translate-x-[2px]'"
                  class="inline-block h-20px w-20px transform rounded-full bg-white transition"
                />
              </Switch>
              <SwitchLabel class="text-16px">
                {{ t('Ignore this release until next reboot') }}
              </SwitchLabel>
            </div>
          </SwitchGroup>
        </div>
        <div
          v-else-if="updateOsIgnoredReleases.length > 0"
          class="w-full max-w-640px mx-auto flex flex-col gap-8px"
        >
          <h3 class="text-left text-16px font-semibold italic">
            {{ t('Ignored Releases') }}
          </h3>
          <UpdateOsIgnoredRelease
            v-for="ignoredRelease in updateOsIgnoredReleases"
            :key="ignoredRelease"
            :label="ignoredRelease"
            :t="t"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div
        class="w-full flex gap-8px mx-auto"
        :class="{
          'flex-col-reverse xs:flex-row justify-between': actionButtons,
          'justify-center': !actionButtons,
        }"
      >
        <div class="flex flex-col-reverse xs:flex-row justify-start gap-8px">
          <BrandButton
            variant="underline-hover-red"
            :icon="XMarkIcon"
            :text="t('Close')"
            @click="close"
          />
          <BrandButton
            variant="underline"
            :icon="ArrowTopRightOnSquareIcon"
            :text="t('More options')"
            @click="accountStore.updateOs()"
          />
        </div>
        <div v-if="actionButtons" class="flex flex-col xs:flex-row justify-end gap-8px">
          <BrandButton
            v-for="item in actionButtons"
            :key="item.text"
            :btn-style="item.variant ?? undefined"
            :icon="item.icon"
            :icon-right="item.iconRight"
            :icon-right-hover-display="item.iconRightHoverDisplay"
            :text="t(item.text ?? '')"
            :title="item.title ? t(item.title) : undefined"
            @click="item.click?.()"
          />
        </div>
      </div>
    </template>
  </Modal>
</template>
