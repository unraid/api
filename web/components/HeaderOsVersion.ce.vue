<script lang="ts" setup>
import { BellAlertIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/vue/24/solid';
import { Badge } from '@unraid/ui';
import { getReleaseNotesUrl, WEBGUI_TOOLS_DOWNGRADE, WEBGUI_TOOLS_UPDATE } from '~/helpers/urls';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';
import { useUpdateOsActionsStore } from '~/store/updateOsActions';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();
const updateOsActionsStore = useUpdateOsActionsStore();

const { osVersion, displayVersion, rebootType, stateDataError } = storeToRefs(serverStore);
const { available, availableWithRenewal } = storeToRefs(updateOsStore);
const { rebootTypeText } = storeToRefs(updateOsActionsStore);

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
        {{ displayVersion }}
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
