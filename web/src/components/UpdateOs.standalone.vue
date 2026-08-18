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
import { computed, onBeforeMount, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import { PageContainer } from '@unraid/ui';
import { WEBGUI_TOOLS_UPDATE } from '~/helpers/urls';

import UpdateOsChangelogModal from '~/components/UpdateOs/ChangelogModal.vue';
import UpdateOsCheckUpdateResponseModal from '~/components/UpdateOs/CheckUpdateResponseModal.vue';
import UpdateOsStatus from '~/components/UpdateOs/Status.vue';
import UpdateOsThirdPartyDrivers from '~/components/UpdateOs/ThirdPartyDrivers.vue';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';

const { t } = useI18n();

export interface Props {
  rebootVersion?: string;
}
const props = withDefaults(defineProps<Props>(), {
  rebootVersion: '',
});

const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();
const { rebootType } = storeToRefs(serverStore);
const updateOsModalVisible = computed(() => updateOsStore.updateOsModalVisible);

const isToolsUpdatePage = computed(
  () => typeof window !== 'undefined' && window.location.pathname === WEBGUI_TOOLS_UPDATE
);

const subtitle = computed(() => {
  if (rebootType.value === 'downgrade') {
    return t('updateOs.pleaseFinishTheInitiatedDowngradeTo');
  }
  return '';
});

onBeforeMount(() => {
  serverStore.setRebootVersion(props.rebootVersion);
});

onMounted(() => {
  if (
    typeof window === 'undefined' ||
    window.location.pathname !== WEBGUI_TOOLS_UPDATE ||
    rebootType.value !== ''
  ) {
    return;
  }

  if (updateOsStore.available || updateOsStore.availableWithRenewal) {
    updateOsStore.setModalOpen(true);
    return;
  }

  void updateOsStore.localCheckForUpdate().catch((error: unknown) => {
    console.error(error);
  });
});
</script>

<template>
  <PageContainer>
    <UpdateOsStatus
      :show-update-check="true"
      :title="t('updateOs.updateUnraidOs')"
      :subtitle="subtitle"
    />
    <UpdateOsCheckUpdateResponseModal
      v-if="isToolsUpdatePage && rebootType === ''"
      :open="updateOsModalVisible"
      embedded
    />
    <UpdateOsChangelogModal v-if="isToolsUpdatePage" />
    <UpdateOsThirdPartyDrivers v-if="rebootType === 'thirdPartyDriversDownloading'" />
  </PageContainer>
</template>
