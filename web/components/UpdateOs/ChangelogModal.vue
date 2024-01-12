<script setup lang="ts">
import { ArrowTopRightOnSquareIcon, ArrowSmallRightIcon, KeyIcon, ServerStackIcon, XMarkIcon } from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { usePurchaseStore } from '~/store/purchase';
import { useUpdateOsStore } from '~/store/updateOs';
// import { useUpdateOsActionsStore } from '~/store/updateOsActions';
import { useUpdateOsChangelogStore } from '~/store/updateOsChangelog';

export interface Props {
  open?: boolean;
  t: any;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
});

const purchaseStore = usePurchaseStore();
const updateOsStore = useUpdateOsStore();
// const updateOsActionsStore = useUpdateOsActionsStore();
const updateOsChangelogStore = useUpdateOsChangelogStore();

const { available, availableWithRenewal } = storeToRefs(updateOsStore);
const {
  isReleaseForUpdateStable,
  releaseForUpdate,
  mutatedParsedChangelog,
  parseChangelogFailed,
  parsedChangelogTitle,
} = storeToRefs(updateOsChangelogStore);

const showExternalChangelogLink = computed(() => {
  return (
    releaseForUpdate.value &&
    isReleaseForUpdateStable.value &&
    (releaseForUpdate.value?.changelog)
  );
});

const showExtendKeyButton = computed(() => {
  return availableWithRenewal.value;
});
</script>

<template>
  <Modal
    :error="!!parseChangelogFailed"
    :open="!!releaseForUpdate"
    :title="parsedChangelogTitle ?? undefined"
    max-width="max-w-800px"
    :t="t"
    @close="updateOsChangelogStore.setReleaseForUpdate(null)"
  >
    <template #main>
      <div
        v-if="mutatedParsedChangelog"
        class="prose dark:prose-invert prose-a:text-unraid-red hover:prose-a:no-underline hover:prose-a:text-unraid-red/60 dark:prose-a:text-orange hover:dark:prose-a:text-orange/60"
        v-html="mutatedParsedChangelog"
      />

      <div
        v-else-if="parseChangelogFailed"
        class="text-center flex flex-col gap-4 prose dark:prose-invert"
      >
        <h2 class="text-lg text-unraid-red italic font-semibold">
          {{ props.t(`Error Parsing Changelog • {0}`, [parseChangelogFailed]) }}
        </h2>
        <p>
          {{ props.t(`It's highly recommended to review the changelog before continuing your update`) }}
        </p>
        <div class="flex self-center">
          <BrandButton
            v-if="releaseForUpdate?.changelog"
            :href="releaseForUpdate?.changelog"
            btn-style="underline"
            :external="true"
            :icon-right="ArrowTopRightOnSquareIcon"
          >
            {{ props.t("View Changelog on Docs") }}
          </BrandButton>
        </div>
      </div>

      <div
        v-else
        class="text-center flex flex-col justify-center w-full min-h-[250px] min-w-[280px] sm:min-w-[400px]"
      >
        <BrandLoading class="w-[150px] mx-auto mt-24px" />
        <p>{{ props.t("Fetching & parsing changelog…") }}</p>
      </div>
    </template>

    <template #footer>
      <div class="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:justify-between">
        <div>
          <BrandButton
            v-if="showExternalChangelogLink"
            :href="releaseForUpdate?.changelog"
            btn-style="underline"
            :external="true"
            :icon-right="ArrowTopRightOnSquareIcon"
          >
            {{ props.t("View Docs") }}
          </BrandButton>
        </div>
        <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
          <BrandButton
            btn-style="underline-hover-red"
            :icon="XMarkIcon"
            @click="updateOsChangelogStore.setReleaseForUpdate(null)"
          >
            {{ props.t("Close") }}
          </BrandButton>
          <template v-if="releaseForUpdate">
            <BrandButton
              v-if="showExtendKeyButton"
              btn-style="fill"
              :icon="KeyIcon"
              :icon-right="ArrowTopRightOnSquareIcon"
              @click="purchaseStore.renew()"
            >
              {{ props.t("Extend Key to Update") }}
            </BrandButton>
            <BrandButton
              v-else-if="releaseForUpdate.sha256"
              :icon="ServerStackIcon"
              :icon-right="ArrowSmallRightIcon"
              @click="updateOsChangelogStore.fetchAndConfirmInstall(releaseForUpdate.sha256)"
            >
              {{ props.t('Confirm Install Unraid OS {0}', [available]) }}
            </BrandButton>
          </template>
        </div>
      </div>
    </template>
  </Modal>
</template>
