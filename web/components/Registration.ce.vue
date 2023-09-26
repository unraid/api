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
import dayjs from 'dayjs'
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import { useServerStore } from '~/store/server';

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

const serverStore = useServerStore();
const {
  deviceCount,
  guid,
  flashVendor,
  flashProduct,
  regGuid,
  regTm,
  regTo,
  state,
  stateData,
  stateDataError,
} = storeToRefs(serverStore);

const items = computed(() => {
  return [
    {
      label: 'Registered to:',
      text: regTo.value,
    },
    {
      label: 'Registered on:',
      text: dayjs(regTm.value).format('YYYY-MM-DD HH:mm'),
    },
    {
      label: 'Updates Expire:',
      text: dayjs(regTm.value).format('YYYY-MM-DD HH:mm'),
    },
    ...(state.value === 'EGUID'
      ? [
          {
            label: 'Registered GUID:',
            text: regGuid.value,
          },
        ]
      : []
    ),
    {
      label: 'Flash GUID:',
      text: guid.value,
    },
    {
      label: 'Flash Vendor:',
      text: flashVendor.value,
    },
    {
      label: 'Flash Product:',
      text: flashProduct.value,
    },
    {
      label: 'Attached Storage Devices:',
      text: deviceCount.value,
    },
  ];
});
</script>

<template>
  <UiPageContainer>
    <UiCardWrapper>
      <div class="p-16px sm:px-20px">
        <h3
          class="text-24px font-semibold"
          :class="{
            'text-red-500': stateDataError,
            'text-green-500': !stateDataError,
          }"
        >
          {{ stateData.heading }}
        </h3>
        <div
          v-if="stateData.message"
          v-html="stateData.message"
          class="text-16px leading-normal opacity-75"></div>
      </div>
      <div>
        <dl>
          <RegistrationItem
            v-for="item in items"
            :key="item.label"
            :label="item.label"
            :text="item.text"
            :t="t" />
          <div class="p-16px sm:px-20px sm:grid sm:grid-cols-3 sm:gap-16px">
            <dt class="text-16px font-medium leading-normal">&nbsp;</dt>
            <dd class="mt-2 text-16px sm:col-span-2 sm:mt-0">
              <KeyActions :t="t" />
            </dd>
          </div>
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
