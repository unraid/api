<script lang="ts" setup>
import { ArrowTopRightOnSquareIcon, EyeIcon, IdentificationIcon, KeyIcon, XMarkIcon } from '@heroicons/vue/24/solid';
import { Switch, SwitchGroup, SwitchLabel } from '@headlessui/vue';
import { storeToRefs } from 'pinia';

import { useAccountStore } from '~/store/account';
import { usePurchaseStore } from '~/store/purchase';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';
// import { useUpdateOsActionsStore } from '~/store/updateOsActions';
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
// const updateOsActionsStore = useUpdateOsActionsStore();
const updateOsChangelogStore = useUpdateOsChangelogStore();

const { osVersionBranch, updateOsResponse } = storeToRefs(serverStore);
const { available, availableWithRenewal, checkForUpdatesLoading } = storeToRefs(updateOsStore);

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
  if (available.value || availableWithRenewal.value) {
    return {
      title: props.t('Unraid OS {0} Update Available', [availableWithRenewal.value ?? available.value ?? '']),
      description: osVersionBranch.value !== 'stable'
        ? props.t('Release requires verification to update')
        : undefined,
    };
  }
  if (!available.value && !availableWithRenewal.value) {
    return {
      title: props.t('Unraid OS is up-to-date'),
      description: props.t('Go to Settings > Notifications to enable OS update notifications for future releases.'),
    };
  }
  return {
    title: props.t('Update OS Modal'),
    description: props.t('This is a test'),
  };
});

const actionButtons = computed((): ButtonProps[] | null => {
  // update not available - no action button default closing
  if (!available.value && !availableWithRenewal.value) { return null; }

  const buttons: ButtonProps[] = [];

  // update available but not stable branch - should link out to account update callback
  if (available.value && osVersionBranch.value !== 'stable') {
    buttons.push({
      click: async () => await accountStore.updateOs(),
      icon: IdentificationIcon,
      text: props.t('Confirm Update Eligibility'),
    });

    return buttons;
  }

  // update available and stable branch - open changelog to commence update
  if (available.value && osVersionBranch.value === 'stable' && updateOsResponse.value) {
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

const ignoreThisRelease = ref(false);

const close = () => {
  // close it
  updateOsStore.setModalOpen(false);
  // then ignore the release if applicable
  if (ignoreThisRelease.value && (availableWithRenewal.value || available.value)) {
    setTimeout(() => {
      updateOsStore.ignoreRelease(availableWithRenewal.value ?? available.value ?? '');
    }, 500);
  }
};

const renderMainSlot = computed(() => {
  return checkForUpdatesLoading.value || available.value || availableWithRenewal.value;
});
</script>

<template>
  <Modal
    :t="t"
    :open="open"
    :title="modalCopy?.title"
    :description="modalCopy?.description"
    :show-close-x="true"
    max-width="max-w-640px"
    @close="close"
  >
    <template v-if="renderMainSlot" #main>
      <BrandLoading v-if="checkForUpdatesLoading" class="w-[150px] mx-auto my-24px" />
      <div v-else-if="available || availableWithRenewal" class="mx-auto my-24px">
        <SwitchGroup>
          <div class="flex items-center gap-8px p-8px bg-gamma-opaque rounded">
            <Switch
              v-model="ignoreThisRelease"
              :class="ignoreThisRelease ? 'bg-gradient-to-r from-unraid-red to-orange' : 'bg-gray-200'"
              class="relative inline-flex h-24px w-[48px] items-center rounded-full"
            >
              <span
                :class="ignoreThisRelease ? 'translate-x-[26px]' : 'translate-x-[2px]'"
                class="inline-block h-20px w-20px transform rounded-full bg-white transition"
              />
            </Switch>
            <SwitchLabel>Ignore this release</SwitchLabel>
          </div>
        </SwitchGroup>
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
