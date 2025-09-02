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

import { BrandLoading, PageContainer } from '@unraid/ui';
import { WEBGUI_TOOLS_UPDATE } from '~/helpers/urls';

import { useAccountStore } from '~/store/account';
import { useServerStore } from '~/store/server';
import UpdateOsStatus from '~/components/UpdateOs/Status.vue';
import UpdateOsThirdPartyDrivers from '~/components/UpdateOs/ThirdPartyDrivers.vue';

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
    return t('Please finish the initiated downgrade to enable updates.');
  }
  return '';
});

/** when we're not prompting for reboot /Tools/Update will automatically send the user to account.unraid.net/server/update-os */
const showLoader = computed(
  () => window.location.pathname === WEBGUI_TOOLS_UPDATE.pathname && rebootType.value === ''
);

onBeforeMount(() => {
  if (showLoader.value) {
    accountStore.updateOs(true);
  }
  serverStore.setRebootVersion(props.rebootVersion);
});
</script>

<template>
  <PageContainer>
    <div v-show="showLoader">
      <BrandLoading class="mx-auto my-12 max-w-[160px]" />
    </div>
    <div v-show="!showLoader">
      <UpdateOsStatus
        :show-update-check="true"
        :title="t('Update Unraid OS')"
        :subtitle="subtitle"
        :t="t"
      />
      <UpdateOsThirdPartyDrivers v-if="rebootType === 'thirdPartyDriversDownloading'" :t="t" />
    </div>
  </PageContainer>
</template>
