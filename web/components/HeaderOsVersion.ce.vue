<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import { BellAlertIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/vue/24/solid';
import { Badge } from '@unraid/ui';
import { getReleaseNotesUrl, WEBGUI_TOOLS_DOWNGRADE, WEBGUI_TOOLS_UPDATE } from '~/helpers/urls';

import { useActivationCodeDataStore } from '~/components/Activation/store/activationCodeData';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';

const { t } = useI18n();

const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();
const updateOsActionsStore = useUpdateOsActionsStore();

const { partnerInfo } = storeToRefs(useActivationCodeDataStore());
const { osVersion, rebootType, stateDataError } = storeToRefs(serverStore);
const { available, availableWithRenewal } = storeToRefs(updateOsStore);
const { rebootTypeText } = storeToRefs(updateOsActionsStore);

watch(partnerInfo, (newVal) => {
  const unraidLogoHeader = document.querySelector('#unraid-logo-header');
  if (unraidLogoHeader) {
    (unraidLogoHeader as HTMLAnchorElement).href = newVal?.partnerUrl ?? 'https://unraid.net';
  }
});

const updateOsStatus = computed(() => {
  if (stateDataError.value) {
    // only allowed to update when server is does not have a state error
    return null;
  }

  if (rebootTypeText.value) {
    return {
      badge: {
        color: 'yellow',
        icon: ExclamationTriangleIcon,
      },
      href:
        rebootType.value === 'downgrade'
          ? WEBGUI_TOOLS_DOWNGRADE.toString()
          : WEBGUI_TOOLS_UPDATE.toString(),
      text: t(rebootTypeText.value),
    };
  }

  if (availableWithRenewal.value || available.value) {
    return {
      badge: {
        color: 'orange',
        icon: BellAlertIcon,
      },
      click: () => {
        updateOsStore.setModalOpen(true);
      },
      text: availableWithRenewal.value ? t('Update Released') : t('Update Available'),
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
      <Badge
        variant="custom"
        :icon="InformationCircleIcon"
        icon-styles="text-header-text-secondary"
        size="sm"
        class="text-header-text-secondary group-hover:text-orange-dark group-focus:text-orange-dark group-hover:underline group-focus:underline"
      >
        {{ osVersion }}
      </Badge>
    </a>
    <component
      :is="updateOsStatus.href ? 'a' : 'button'"
      v-if="updateOsStatus"
      :href="updateOsStatus.href ?? undefined"
      :title="updateOsStatus.title ?? undefined"
      class="group"
      @click="updateOsStatus.click?.()"
    >
      <Badge
        v-if="updateOsStatus.badge"
        :color="updateOsStatus.badge.color"
        :icon="updateOsStatus.badge.icon"
        size="xs"
      >
        {{ updateOsStatus.text }}
      </Badge>
      <template v-else>
        {{ updateOsStatus.text }}
      </template>
    </component>
  </div>
</template>

<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
</style>
