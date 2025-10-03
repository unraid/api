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

import { PageContainer } from '@unraid/ui';

import UpdateOsDowngrade from '~/components/UpdateOs/Downgrade.vue';
import UpdateOsStatus from '~/components/UpdateOs/Status.vue';
import UpdateOsThirdPartyDrivers from '~/components/UpdateOs/ThirdPartyDrivers.vue';
import { useServerStore } from '~/store/server';

const { t } = useI18n();

export interface Props {
  rebootVersion?: string;
  restoreReleaseDate?: string;
  restoreVersion?: string;
}
const props = withDefaults(defineProps<Props>(), {
  rebootVersion: '',
  restoreReleaseDate: '',
  restoreVersion: '',
});

const serverStore = useServerStore();

const { rebootType, osVersionBranch } = storeToRefs(serverStore);

const subtitle = computed(() => {
  if (rebootType.value === 'update') {
    return t('downgradeOs.pleaseFinishTheInitiatedUpdateTo');
  }
  return '';
});

const showExternalDowngrade = computed(() => osVersionBranch.value !== 'stable');

onBeforeMount(() => {
  serverStore.setRebootVersion(props.rebootVersion);
});
</script>

<template>
  <div>
    <PageContainer>
      <UpdateOsStatus
        :title="t('downgradeOs.downgradeUnraidOs')"
        :subtitle="subtitle"
        :downgrade-not-available="restoreVersion === '' && rebootType === ''"
        :show-external-downgrade="showExternalDowngrade"
        :t="t"
      />
      <UpdateOsDowngrade
        v-if="restoreVersion && rebootType === ''"
        :release-date="restoreReleaseDate"
        :version="restoreVersion"
        :t="t"
      />
      <UpdateOsThirdPartyDrivers v-if="rebootType === 'thirdPartyDriversDownloading'" :t="t" />
    </PageContainer>
  </div>
</template>
