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
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import { useUpdateOsActionsStore } from '~/store/updateOsActions';

import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

const { t } = useI18n();

export interface Props {
  restoreReleaseDate?: string;
  restoreVersion?: string;
}
withDefaults(defineProps<Props>(), {
  restoreReleaseDate: '',
  restoreVersion: '',
});

const updateOsActionsStore = useUpdateOsActionsStore();

const { rebootType } = storeToRefs(updateOsActionsStore);
</script>

<template>
  <UiPageContainer>
    <UpdateOsStatus
      :title="t('Downgrade Unraid OS')"
      :downgrade-not-available="restoreVersion === ''"
      :t="t" />
    <UpdateOsDowngrade
      v-if="restoreVersion && rebootType === ''"
      :release-date="restoreReleaseDate"
      :version="restoreVersion"
      :t="t"
    />
    <UpdateOsThirdPartyDrivers
      v-if="rebootType === 'thirdPartyDriversDownloading'"
      :t="t"
    />
  </UiPageContainer>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
