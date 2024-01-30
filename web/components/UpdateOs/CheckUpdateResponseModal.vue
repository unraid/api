<script lang="ts" setup>
import { ArrowTopRightOnSquareIcon, EyeIcon, IdentificationIcon, KeyIcon, XMarkIcon } from '@heroicons/vue/24/solid';
import { Switch, SwitchGroup, SwitchLabel } from '@headlessui/vue';
import { storeToRefs } from 'pinia';

import useDateTimeHelper from '~/composables/dateTime';
import { useAccountStore } from '~/store/account';
import { usePurchaseStore } from '~/store/purchase';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';
import { useUpdateOsChangelogStore } from '~/store/updateOsChangelog';
import type { ButtonProps } from '~/types/ui/button';

export interface Props {
  open?: boolean;
  t: any;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
});

const accountStore = useAccountStore();
const purchaseStore = usePurchaseStore();
const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();
const updateOsChangelogStore = useUpdateOsChangelogStore();

const {
  dateTimeFormat,
  updateOsResponse,
  updateOsIgnoredReleases,
  regExp,
  regUpdatesExpired,
} = storeToRefs(serverStore);
const {
  available,
  availableWithRenewal,
  availableReleaseDate,
  availableRequiresAuth,
  checkForUpdatesLoading,
} = storeToRefs(updateOsStore);

const {
  outputDateTimeFormatted: formattedRegExp,
} = useDateTimeHelper(dateTimeFormat.value, props.t, true, regExp.value);

// @todo - if we don't get a sha256 we need to auth
// @todo - when true change primary action button to be close and hide secondary button
const ignoreThisRelease = ref(false);

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
      ? props.t('Ineligible for updates released after {0}', [formattedRegExp.value])
      : props.t('Eligible for updates until {0}', [formattedRegExp.value]);
    return {
      title: props.t('Unraid OS {0} has been released', [availableWithRenewal.value]),
      description: `<p>${formattedReleaseDate}</p><p>${description}</p>`,
    };
  } else if (available.value) {
    const description = availableRequiresAuth.value
      ? props.t('Release requires verification to update')
      : undefined;
    return {
      title: props.t('Unraid OS {0} Update Available', [available.value]),
      description: description ? `<p>${formattedReleaseDate}</p><p>${description}</p>` : formattedReleaseDate,
    };
  } else if (!available.value && !availableWithRenewal.value) {
    /** @todo - conditionally show this description for when the setting isn't set */
    return {
      title: props.t('Unraid OS is up-to-date'),
      description: props.t('Go to Settings > Notifications to enable OS update notifications for future releases.'),
    };
  }
  return null;
});

const actionButtons = computed((): ButtonProps[] | null => {
  // update not available or no action buttons default closing
  if (!available.value || ignoreThisRelease.value) { return null; }

  const buttons: ButtonProps[] = [];

  // update available but not stable branch - should link out to account update callback
  if (availableRequiresAuth.value) {
    buttons.push({
      click: async () => await accountStore.updateOs(),
      icon: IdentificationIcon,
      text: props.t('Verify to Update'),
    });

    return buttons;
  }

  // update available and stable branch - open changelog to commence update
  if (available.value) {
    buttons.push({
      click: async () => await updateOsChangelogStore.setReleaseForUpdate(updateOsResponse.value ?? null),
      icon: EyeIcon,
      text: availableWithRenewal.value ? props.t('View Changelog') : props.t('View Changelog to Start Update'),
    });
  }

  // update available with renewal - open changelog and extend key options
  if (availableWithRenewal.value) {
    buttons.push({
      click: async () => await purchaseStore.renew(),
      icon: KeyIcon,
      iconRight: ArrowTopRightOnSquareIcon,
      iconRightHoverDisplay: true,
      text: props.t('Extend Key'),
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
  return checkForUpdatesLoading.value || available.value || availableWithRenewal.value || updateOsIgnoredReleases.value.length > 0;
});

const userFormattedReleaseDate = ref<any>();
/**
 * availableReleaseDate may not have a value until we get a release in the update os check response.
 * So we need to watch for this value to be able to format it based on the user's date time preferences.
 */
const setUserFormattedReleaseDate = () => {
  if (!availableReleaseDate.value) { return; }

  const { outputDateTimeFormatted } = useDateTimeHelper(dateTimeFormat.value, props.t, true, availableReleaseDate.value.valueOf());
  userFormattedReleaseDate.value = outputDateTimeFormatted.value;
};
watch(availableReleaseDate, (_newV) => {
  setUserFormattedReleaseDate();
});
onBeforeMount(() => {
  if (availableReleaseDate.value) {
    setUserFormattedReleaseDate();
  }
});
</script>

<template>
  <Modal
    :t="t"
    :open="open"
    :title="modalCopy?.title"
    :description="modalCopy?.description"
    :show-close-x="!checkForUpdatesLoading"
    max-width="max-w-640px"
    @close="close"
  >
    <template v-if="renderMainSlot" #main>
      <BrandLoading v-if="checkForUpdatesLoading" class="w-[150px] mx-auto" />
      <div v-else-if="available || availableWithRenewal" class="mx-auto">
        <SwitchGroup>
          <div class="flex justify-center items-center gap-8px p-8px rounded">
            <Switch
              v-model="ignoreThisRelease"
              :class="ignoreThisRelease ? 'bg-gradient-to-r from-unraid-red to-orange' : 'bg-transparent'"
              class="relative inline-flex h-24px w-[48px] items-center rounded-full overflow-hidden"
            >
              <span v-show="!ignoreThisRelease" class="absolute z-0 inset-0 opacity-10 bg-beta" />
              <span
                :class="ignoreThisRelease ? 'translate-x-[26px]' : 'translate-x-[2px]'"
                class="inline-block h-20px w-20px transform rounded-full bg-white transition"
              />
            </Switch>
            <SwitchLabel>{{ t('Ignore this release until next reboot') }}</SwitchLabel>
          </div>
        </SwitchGroup>
      </div>
      <div v-else-if="updateOsIgnoredReleases.length > 0" class="w-full flex flex-col gap-8px">
        <h3 class="text-16px font-semibold italic">
          {{ t('Ignored Releases') }}
        </h3>
        <UpdateOsIgnoredRelease
          v-for="ignoredRelease in updateOsIgnoredReleases"
          :key="ignoredRelease"
          :label="ignoredRelease"
          :t="t"
        />
      </div>
    </template>

    <template v-if="!checkForUpdatesLoading" #footer>
      <div
        class="w-full flex gap-8px mx-auto"
        :class="{
          'flex-col-reverse sm:flex-row justify-between': actionButtons,
          'justify-center': !actionButtons,
        }"
      >
        <BrandButton
          btn-style="underline-hover-red"
          :icon="XMarkIcon"
          :text="t('Close')"
          @click="close"
        />
        <div v-if="actionButtons" class="flex flex-col sm:flex-row justify-end">
          <BrandButton
            v-for="item in actionButtons"
            :key="item.text"
            :icon="item.icon"
            :icon-right="item.iconRight"
            :icon-right-hover-display="item.iconRightHoverDisplay"
            :text="t(item.text)"
            :title="item.title ? t(item.title) : undefined"
            @click="item.click ? item.click() : undefined"
          />
        </div>
      </div>
    </template>
  </Modal>
</template>
