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
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
} from '@heroicons/vue/24/solid';
import dayjs from 'dayjs'
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import { useServerStore } from '~/store/server';

import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

import KeyActions from '~/components/KeyActions.vue';
import RegistrationUpgradeExpiration from '~/components/Registration/UpgradeExpiration.vue';

const { t } = useI18n();

export interface Props {
  restoreReleaseDate?: string;
  restoreVersion?: string;
}
withDefaults(defineProps<Props>(), {
  restoreReleaseDate: '',
  restoreVersion: '',
});

const serverStore = useServerStore();
const {
  deviceCount,
  guid,
  flashVendor,
  flashProduct,
  keyActions,
  keyfile,
  regGuid,
  regTm,
  regTo,
  regTy,
  regUpdExpAt,
  regUpdExpired,
  state,
  stateData,
  stateDataError,
} = storeToRefs(serverStore);

const devicesAvailable = computed(() => {
  switch(regTy.value) {
    case 'Basic':
      return 6;
    case 'Plus':
      return 12;
    case 'Pro':
    case 'Trial':
      return 'unlimited';
  }
});

const items = computed(() => {
  return [
    ...(regTy.value ? [{ label: t('License key type'), text: regTy.value }] : []),
    ...(regTo.value ? [ { label: t('Registered to'), text: regTo.value }] : []),
    ...(regTo.value ? [{ label: t('Registered on'), text: dayjs(regTm.value).format('YYYY-MM-DD HH:mm')}] : []),
    /**
     * @todo factor in grandfathered users and display a different message
     */
    ...(regUpdExpAt.value
      ? [{
          error: regUpdExpired.value,
          label: t('OS Update Eligibility'),
          component: RegistrationUpgradeExpiration,
          componentProps: { t: t },
        }]
      : []),
    ...(state.value === 'EGUID' ? [{ label: t('Registered GUID'), text: regGuid.value }] : [] ),
    { label: t('Flash GUID'), text: guid.value },
    { label: t('Flash Vendor'), text: flashVendor.value },
    { label: t('Flash Product'), text: flashProduct.value },
    { label: t('Attached Storage Devices'), text: t('{0} out of {1} devices', [deviceCount.value, devicesAvailable.value]) },
    ...(regUpdExpAt.value
      ? [{
          label: t('License key actions'),
          component: KeyActions,
          componentProps: { t: t },
        }]
      : []),
  ];
});
</script>

<template>
  <UiPageContainer class="max-w-800px">
    <UiCardWrapper :increased-padding="true">
      <div class="flex flex-col gap-20px sm:gap-24px">
        <header class="grid gap-y-16px">
          <h3
            class="text-20px md:text-24px font-semibold leading-normal flex flex-row items-center gap-8px"
            :class="stateDataError ? 'text-unraid-red' : 'text-green-500'"
          >
            <component :is="stateDataError ? ShieldExclamationIcon : ShieldCheckIcon" class="w-24px h-24px" />
            <span>
              {{ stateData.heading }}
            </span>
          </h3>
          <div
            v-if="stateData.message"
            v-html="stateData.message"
            class="prose text-16px leading-relaxed whitespace-normal opacity-75"></div>
        </header>
        <dl>
          <RegistrationItem
            v-for="item in items"
            :key="item.label"
            :component="item?.component"
            :component-props="item?.componentProps"
            :error="item.error ?? false"
            :label="item.label"
            :text="item.text"
          >
            <template v-if="item.component" #right>
              <component :is="item.component" v-bind="item.componentProps" />
            </template>
          </RegistrationItem>
        </dl>
      </div>
    </UiCardWrapper>
  </UiPageContainer>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
