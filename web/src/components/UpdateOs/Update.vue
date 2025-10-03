<script lang="ts" setup>
/**
 * @todo require keyfile to be set before allowing user to check for OS updates
 * @todo require keyfile to update
 * @todo require valid guid / server state to update
 */
import { computed, ref, watchEffect } from 'vue';
import { storeToRefs } from 'pinia';

import {
  ArchiveBoxArrowDownIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BellAlertIcon,
  EyeIcon,
} from '@heroicons/vue/24/solid';
import { BrandButton, CardWrapper } from '@unraid/ui';
import { Switch, SwitchGroup, SwitchLabel } from '@headlessui/vue';
import dayjs from 'dayjs';

import type { UserProfileLink } from '~/types/userProfile';
import type { ComposerTranslation } from 'vue-i18n';

import useDateTimeHelper from '~/composables/dateTime';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';

const props = defineProps<{
  t: ComposerTranslation;
}>();

const serverStore = useServerStore();
const { dateTimeFormat, updateOsResponse } = storeToRefs(serverStore);

const updateOsStore = useUpdateOsStore();
const updateOsActionsStore = useUpdateOsActionsStore();

const { connectPluginInstalled, flashBackupActivated } = storeToRefs(useServerStore());
const { available } = storeToRefs(updateOsStore);

const { outputDateTimeFormatted: formattedReleaseDate } = useDateTimeHelper(
  dateTimeFormat.value,
  props.t,
  true,
  dayjs(updateOsResponse.value?.date ?? '', 'YYYY-MM-DD').valueOf()
);

const updateButton = ref<UserProfileLink | undefined>();

const heading = computed(() => {
  if (available.value && updateButton?.value?.text && updateButton?.value?.textParams) {
    return props.t(updateButton?.value.text, updateButton?.value.textParams);
  }
  return props.t('updateOs.callbackButton.checkForOsUpdates');
});

const headingIcon = computed(() => {
  if (available.value) {
    return BellAlertIcon;
  }
  return ArrowPathIcon;
});

const flashBackupCopy = computed(() => {
  const base = props.t('updateOs.update.weRecommendBackingUpYourUsb');
  if (connectPluginInstalled.value && flashBackupActivated.value) {
    return `${base}
      ${props.t('updateOs.update.youHaveAlreadyActivatedTheFlash')}
      ${props.t('connect.flashBackup.goToToolsManagementAccessTo2')}
      ${props.t('updateOs.update.youCanAlsoManuallyCreateA')}
    `;
  }
  if (connectPluginInstalled.value && !flashBackupActivated.value) {
    return `${base}
      ${props.t('updateOs.update.youHaveNotActivatedTheFlash')}
      ${props.t('connect.flashBackup.goToToolsManagementAccessTo')}
      ${props.t('updateOs.update.youCanAlsoManuallyCreateA')}
    `;
  }
  return `${base} ${props.t('updateOs.update.youCanManuallyCreateABackup')}`;
});

const acknowledgeBackup = ref<boolean>(false);
const flashBackupBasicStatus = ref<'complete' | 'ready' | 'started'>('ready');
const flashBackupText = computed(() => props.t('updateOs.update.createFlashBackup'));
const startFlashBackup = () => {
  console.debug('[startFlashBackup]', Date.now());
  if (typeof window.flashBackup === 'function') {
    flashBackupBasicStatus.value = 'started';
    window.flashBackup();
    checkFlashBackupStatus();
  } else {
    alert(props.t('updateOs.update.flashBackupIsNotAvailableNavigate', [window.location.origin]));
  }
};
/**
 * Checking for element on the page to determine if the flash backup has started
 */
const checkFlashBackupStatus = () => {
  const loadingElement: HTMLCollection = document.getElementsByClassName('spinner');
  setTimeout(() => {
    if (loadingElement.length > 0 && loadingElement[0]) {
      const el = loadingElement[0] as HTMLDivElement;
      const loaderHidden = el.style.display === 'none';
      if (loaderHidden) {
        flashBackupBasicStatus.value = 'complete';
        console.debug('[checkFlashBackupStatus] complete', Date.now());
      } else {
        checkFlashBackupStatus(); // check again
      }
    } else {
      flashBackupBasicStatus.value = 'complete';
    }
  }, 500);
};

const disableCallbackButton = computed(
  () => !acknowledgeBackup.value || flashBackupBasicStatus.value === 'started'
);

watchEffect(() => {
  if (available.value) {
    updateButton.value = updateOsActionsStore.updateCallbackButton();
  } else {
    updateButton.value = updateOsActionsStore.updateCallbackButton();
  }
  if (flashBackupBasicStatus.value === 'complete') {
    acknowledgeBackup.value = true; // auto check the box
  }
});
</script>

<template>
  <CardWrapper :increased-padding="true">
    <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div class="grid gap-y-4">
        <h3 class="flex flex-row items-start justify-start gap-2 leading-normal font-semibold">
          <component :is="headingIcon" class="w-5 shrink-0" />
          <span class="inline-flex flex-wrap items-baseline justify-start gap-2 leading-none">
            <span class="text-xl">
              {{ heading }}
            </span>
            <span v-if="updateOsResponse && formattedReleaseDate" class="shrink text-base opacity-75">
              {{ formattedReleaseDate }}
            </span>
          </span>
        </h3>

        <div class="prose text-base leading-relaxed whitespace-normal opacity-75">
          <p>
            {{ t('updateOs.update.receiveTheLatestAndGreatestFor') }}
          </p>
          <p v-if="available">
            {{ flashBackupCopy }}
          </p>
        </div>
      </div>

      <div class="flex flex-col items-center gap-4 sm:shrink-0">
        <template v-if="available && updateButton">
          <BrandButton
            variant="outline"
            :disabled="flashBackupBasicStatus === 'started'"
            :icon="ArchiveBoxArrowDownIcon"
            :name="'flashBackup'"
            :text="flashBackupText"
            class="flex-none"
            @click="startFlashBackup"
          />

          <p v-if="flashBackupBasicStatus === 'started'" class="shrink text-xs italic opacity-75">
            {{ t('updateOs.update.backingUpThisMayTakeA') }}
          </p>

          <SwitchGroup as="div">
            <div class="flex shrink-0 items-center gap-4">
              <Switch
                v-model="acknowledgeBackup"
                :disabled="flashBackupBasicStatus === 'started'"
                :class="[
                  acknowledgeBackup ? 'bg-green-500' : 'bg-gray-200',
                  'relative inline-flex h-6 w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 focus:outline-hidden',
                ]"
              >
                <span
                  :class="[
                    acknowledgeBackup ? 'translate-x-20px' : 'translate-x-0',
                    'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                  ]"
                >
                  <span
                    :class="[
                      acknowledgeBackup
                        ? 'opacity-0 duration-100 ease-out'
                        : 'opacity-100 duration-200 ease-in',
                      'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
                    ]"
                    aria-hidden="true"
                  >
                    <svg class="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                      <path
                        d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </span>
                  <span
                    :class="[
                      acknowledgeBackup
                        ? 'opacity-100 duration-200 ease-in'
                        : 'opacity-0 duration-100 ease-out',
                      'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
                    ]"
                    aria-hidden="true"
                  >
                    <svg class="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 12 12">
                      <path
                        d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z"
                      />
                    </svg>
                  </span>
                </span>
              </Switch>
              <SwitchLabel class="text-sm">
                {{ t('updateOs.update.iHaveMadeAFlashBackup') }}
              </SwitchLabel>
            </div>
          </SwitchGroup>
        </template>

        <BrandButton
          :disabled="disableCallbackButton"
          :external="updateButton?.external"
          :icon="EyeIcon"
          :icon-right="ArrowTopRightOnSquareIcon"
          :name="updateButton?.name"
          :text="t('updateOs.update.viewAvailableUpdates')"
          :title="!acknowledgeBackup ? t('updateOs.update.acklowledgeThatYouHaveMadeA') : ''"
          class="flex-none"
          @click="updateButton?.click"
        />
      </div>
    </div>
  </CardWrapper>
</template>
