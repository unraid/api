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
  return props.t('Check for OS Updates');
});

const headingIcon = computed(() => {
  if (available.value) {
    return BellAlertIcon;
  }
  return ArrowPathIcon;
});

const flashBackupCopy = computed(() => {
  const base = props.t('We recommend backing up your USB Flash Boot Device before starting the update.');
  if (connectPluginInstalled.value && flashBackupActivated.value) {
    return `${base}
      ${props.t('You have already activated the Flash Backup feature via the Unraid Connect plugin.')}
      ${props.t('Go to Tools > Management Access to ensure your backup is up-to-date.')}
      ${props.t('You can also manually create a new backup by clicking the Create Flash Backup button.')}
    `;
  }
  if (connectPluginInstalled.value && !flashBackupActivated.value) {
    return `${base}
      ${props.t('You have not activated the Flash Backup feature via the Unraid Connect plugin.')}
      ${props.t('Go to Tools > Management Access to activate the Flash Backup feature and ensure your backup is up-to-date.')}
      ${props.t('You can also manually create a new backup by clicking the Create Flash Backup button.')}
    `;
  }
  return `${base} ${props.t('You can manually create a backup by clicking the Create Flash Backup button.')}`;
});

const acknowledgeBackup = ref<boolean>(false);
const flashBackupBasicStatus = ref<'complete' | 'ready' | 'started'>('ready');
const flashBackupText = computed(() => props.t('Create Flash Backup'));
const startFlashBackup = () => {
  console.debug('[startFlashBackup]', Date.now());
  // @ts-expect-error – global function provided by the webgui on the update page
  if (typeof flashBackup === 'function') {
    flashBackupBasicStatus.value = 'started';
    // @ts-expect-error – global function provided by the webgui on the update page
    flashBackup();
    checkFlashBackupStatus();
  } else {
    alert(
      props.t(
        'Flash Backup is not available. Navigate to {0}/Main/Settings/Flash to try again then come back to this page.',
        [window.location.origin]
      )
    );
  }
};
/**
 * Checking for element on the page to determine if the flash backup has started
 */
const checkFlashBackupStatus = () => {
  const loadingElement: HTMLCollectionOf<Element> = document.getElementsByClassName('spinner');
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
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-6">
      <div class="grid gap-y-4">
        <h3 class="font-semibold leading-normal flex flex-row items-start justify-start gap-2">
          <component :is="headingIcon" class="w-5 shrink-0" />
          <span class="leading-none inline-flex flex-wrap justify-start items-baseline gap-2">
            <span class="text-xl">
              {{ heading }}
            </span>
            <span v-if="updateOsResponse && formattedReleaseDate" class="text-base opacity-75 shrink">
              {{ formattedReleaseDate }}
            </span>
          </span>
        </h3>

        <div class="prose opacity-75 text-base leading-relaxed whitespace-normal">
          <p>
            {{
              t(
                'Receive the latest and greatest for Unraid OS. Whether it new features, security patches, or bug fixes – keeping your server up-to-date ensures the best experience that Unraid has to offer.'
              )
            }}
          </p>
          <p v-if="available">
            {{ flashBackupCopy }}
          </p>
        </div>
      </div>

      <div class="flex flex-col sm:shrink-0 items-center gap-4">
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

          <p v-if="flashBackupBasicStatus === 'started'" class="text-xs italic opacity-75 shrink">
            {{ t('Backing up...this may take a few minutes') }}
          </p>

          <SwitchGroup as="div">
            <div class="flex shrink-0 items-center gap-4">
              <Switch
                v-model="acknowledgeBackup"
                :disabled="flashBackupBasicStatus === 'started'"
                :class="[
                  acknowledgeBackup ? 'bg-green-500' : 'bg-gray-200',
                  'relative inline-flex h-6 w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2',
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
                {{ t('I have made a Flash Backup') }}
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
          :text="t('View Available Updates')"
          :title="
            !acknowledgeBackup
              ? t('Acklowledge that you have made a Flash Backup to enable this action')
              : ''
          "
          class="flex-none"
          @click="updateButton?.click"
        />
      </div>
    </div>
  </CardWrapper>
</template>
