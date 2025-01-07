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

import { getReleaseNotesUrl, WEBGUI_TOOLS_DOWNGRADE, WEBGUI_TOOLS_UPDATE } from '~/helpers/urls';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';
import type { UserProfileLink } from '~/types/userProfile';
import type { UiBadgeProps, UiBadgePropsColor } from '~/types/ui/badge';

const { t } = useI18n();

const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();
const updateOsActionsStore = useUpdateOsActionsStore();

const { osVersion, rebootType, stateDataError } = storeToRefs(serverStore);
const { available, availableWithRenewal } = storeToRefs(updateOsStore);
const { rebootTypeText } = storeToRefs(updateOsActionsStore);

export interface UpdateOsStatus extends UserProfileLink {
  badge: UiBadgeProps;
}
const updateOsStatus = computed(() => {
  if (stateDataError.value) { // only allowed to update when server is does not have a state error
    return null;
  }

  if (rebootTypeText.value) {
    return {
      badge: {
        color: 'yellow' as UiBadgePropsColor,
        icon: ExclamationTriangleIcon,
      },
      href: rebootType.value === 'downgrade'
        ? WEBGUI_TOOLS_DOWNGRADE.toString()
        : WEBGUI_TOOLS_UPDATE.toString(),
      text: t(rebootTypeText.value),
    };
  }

  if (availableWithRenewal.value || available.value) {
    return {
      badge: {
        color: 'orange' as UiBadgePropsColor,
        icon: BellAlertIcon,
      },
      click: () => { updateOsStore.setModalOpen(true); },
      text: availableWithRenewal.value
        ? t('Update Released')
        : t('Update Available'),
      title: availableWithRenewal.value
        ? t('Unraid OS {0} Released', [availableWithRenewal.value])
        : t('Unraid OS {0} Update Available', [available.value]),
    };
  }

  return null;
});
</script>

<template>
  <div class="flex flex-row justify-start gap-x-4px">
    <a
      class="group leading-none"
      :title="t('View release notes')"
      :href="getReleaseNotesUrl(osVersion).toString()"
      target="_blank"
      rel="noopener"
    >
      <UiBadge
        color="custom"
        :icon="InformationCircleIcon"
        icon-styles="text-header-text-secondary"
        size="14px"
        class="text-gamma group-hover:text-orange-dark group-focus:text-orange-dark group-hover:underline group-focus:underline"
      >
        {{ osVersion }}
      </UiBadge>
    </a>
    <component
      :is="updateOsStatus.href ? 'a' : 'button'"
      v-if="updateOsStatus"
      :href="updateOsStatus.href ?? undefined"
      :title="updateOsStatus.title ?? undefined"
      class="group"
      @click="updateOsStatus.click?.()"
    >
      <UiBadge
        v-if="updateOsStatus.badge"
        :color="updateOsStatus.badge.color"
        :icon="updateOsStatus.badge.icon"
        size="12px"
      >
        {{ updateOsStatus.text }}
      </UiBadge>
      <template v-else>
        {{ updateOsStatus.text }}
      </template>
    </component>
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
