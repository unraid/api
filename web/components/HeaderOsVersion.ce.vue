<script lang="ts" setup>
import {
  BellAlertIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

import { WEBGUI_TOOLS_UPDATE } from '~/helpers/urls';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore, useUpdateOsActionsStore } from '~/store/updateOsActions';

const { t } = useI18n();

const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();
const updateOsActionsStore = useUpdateOsActionsStore();

const { osVersion } = storeToRefs(serverStore);
const { available } = storeToRefs(updateOsStore);
const { ineligibleText, rebootType, rebootTypeText } = storeToRefs(updateOsActionsStore);

const showUpdateAvailable = computed(() => !ineligibleText.value && available.value && rebootType.value === '');
const showRebootRequired = computed(() => rebootType.value !== '');
</script>

<template>
  <div class="flex flex-row justify-center gap-x-4px">
    <button
      @click="updateOsActionsStore.viewCurrentReleaseNotes(t('{0} Release Notes', [osVersion]))"
      class="group"
      :title="t('View release notes')"
    >
      <UiBadge
        color="custom"
        :icon="InformationCircleIcon"
        icon-styles="text-gamma"
        size="14px"
        class="text-gamma group-hover:text-orange-dark group-focus:text-orange-dark group-hover:underline group-focus:underline"
      >
        {{ osVersion }}
      </UiBadge>
    </button>

    <a
      v-if="showUpdateAvailable || showRebootRequired"
      :href="WEBGUI_TOOLS_UPDATE.toString()"
      class="group"
      :title="t('Go to Tools > Update')"
    >
      <UiBadge
        v-if="showUpdateAvailable"
        color="orange"
        :icon="BellAlertIcon"
        size="12px"
      >
        {{ t('Update Available') }}
      </UiBadge>
      <UiBadge
        v-else-if="showRebootRequired"
        :color="'yellow'"
        :icon="ExclamationTriangleIcon"
        size="12px"
      >
        {{ t(rebootTypeText) }}
      </UiBadge>
    </a>
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
