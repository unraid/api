<script lang="ts" setup>
/**
 * @todo how are we going to update test, beta, and stable releases for internal testing?
 * @todo after install / downgrade detect if third-party drivers are installed and tell users to wait for a user to wait for a new notification
 *
 * run exec("ps aux | grep -E "inotifywait -q /boot/changes.txt -e move_self,delete_self" | grep -v "grep -E inotifywait" | awk '{print $2}'");
 * if this returns are value assume we have third-party drivers installed and tell the user to wait for a new notification
 *
 * view https://s3.amazonaws.com/dnld.lime-technology.com/stable/unRAIDServer.plg to see how the update is handled
# ensure writes to USB flash boot device have completed
sync -f /boot
if [ -z "${plg_update_helper}" ]; then
  echo "Update successful - PLEASE REBOOT YOUR SERVER"
else
  echo "Third party plugins found - PLEASE CHECK YOUR UNRAID NOTIFICATIONS AND WAIT FOR THE MESSAGE THAT IT IS SAFE TO REBOOT!"
fi
 */
import { computed, onBeforeMount } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { BrandButton, PageContainer } from '@unraid/ui';
import { WEBGUI_TOOLS_UPDATE } from '~/helpers/urls';

import UpdateOsStatus from '~/components/UpdateOs/Status.vue';
import UpdateOsThirdPartyDrivers from '~/components/UpdateOs/ThirdPartyDrivers.vue';
import { useAccountStore } from '~/store/account';
import { useServerStore } from '~/store/server';

const { t } = useI18n();

export interface Props {
  rebootVersion?: string;
}
const props = withDefaults(defineProps<Props>(), {
  rebootVersion: '',
});

const accountStore = useAccountStore();
const serverStore = useServerStore();
const { rebootType } = storeToRefs(serverStore);

const subtitle = computed(() => {
  if (rebootType.value === 'downgrade') {
    return t('updateOs.pleaseFinishTheInitiatedDowngradeTo');
  }
  return '';
});

// Show a prompt to continue in the Account app when no reboot is pending.
const showRedirectPrompt = computed(
  () =>
    typeof window !== 'undefined' &&
    window.location.pathname === WEBGUI_TOOLS_UPDATE &&
    rebootType.value === ''
);

const openAccountUpdate = () => {
  accountStore.updateOs(true);
};

onBeforeMount(() => {
  serverStore.setRebootVersion(props.rebootVersion);
});
</script>

<template>
  <PageContainer>
    <div
      v-if="showRedirectPrompt"
      class="mx-auto flex max-w-[720px] flex-col items-center gap-4 py-8 text-center"
    >
      <h1 class="text-2xl font-semibold">{{ t('updateOs.updateUnraidOs') }}</h1>
      <p class="text-base leading-relaxed opacity-75">
        {{ t('updateOs.update.receiveTheLatestAndGreatestFor') }}
      </p>
      <BrandButton
        data-testid="update-os-account-button"
        :icon-right="ArrowTopRightOnSquareIcon"
        @click="openAccountUpdate"
      >
        {{ t('updateOs.update.viewAvailableUpdates') }}
      </BrandButton>
    </div>
    <div v-else>
      <UpdateOsStatus
        :show-update-check="true"
        :title="t('updateOs.updateUnraidOs')"
        :subtitle="subtitle"
      />
      <UpdateOsThirdPartyDrivers v-if="rebootType === 'thirdPartyDriversDownloading'" />
    </div>
  </PageContainer>
</template>
