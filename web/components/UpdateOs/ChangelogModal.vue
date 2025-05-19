<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import {
  ArrowSmallRightIcon,
  ArrowTopRightOnSquareIcon,
  EyeIcon,
  KeyIcon,
  ServerStackIcon,
  XMarkIcon,
} from '@heroicons/vue/24/solid';
import { BrandButton, BrandLoading } from '@unraid/ui';

import { useI18n } from '~/composables/useI18n';
import { usePurchaseStore } from '~/store/purchase';
import { useUpdateOsStore } from '~/store/updateOs';
// import { useUpdateOsActionsStore } from '~/store/updateOsActions';
import { useUpdateOsChangelogStore } from '~/store/updateOsChangelog';

const { $gettext } = useI18n();
const purchaseStore = usePurchaseStore();
const updateOsStore = useUpdateOsStore();
// const updateOsActionsStore = useUpdateOsActionsStore();
const updateOsChangelogStore = useUpdateOsChangelogStore();

const { availableWithRenewal } = storeToRefs(updateOsStore);
const { releaseForUpdate, mutatedParsedChangelog, parseChangelogFailed, parsedChangelogTitle } =
  storeToRefs(updateOsChangelogStore);

const showExtendKeyButton = computed(() => {
  return availableWithRenewal.value;
});
</script>

<template>
  <Modal
    :center-content="false"
    :error="!!parseChangelogFailed"
    max-width="max-w-800px"
    :open="!!releaseForUpdate"
    :show-close-x="true"
    :tall-content="true"
    :title="parsedChangelogTitle ?? undefined"
    @close="updateOsChangelogStore.setReleaseForUpdate(null)"
  >
    <template #main>
      <div
        v-if="mutatedParsedChangelog"
        class="text-16px sm:text-18px prose prose-a:text-unraid-red hover:prose-a:no-underline hover:prose-a:text-unraid-red/60 dark:prose-a:text-orange hover:dark:prose-a:text-orange/60"
        v-html="mutatedParsedChangelog"
      />

      <div v-else-if="parseChangelogFailed" class="text-center flex flex-col gap-4 prose">
        <h2 class="text-lg text-unraid-red italic font-semibold">
          {{ $gettext(`Error Parsing Changelog • ${parseChangelogFailed}`) }}
        </h2>
        <p>
          {{ $gettext(`It's highly recommended to review the changelog before continuing your update`) }}
        </p>
        <div v-if="releaseForUpdate?.changelogPretty" class="flex self-center">
          <BrandButton
            :href="releaseForUpdate?.changelogPretty"
            variant="underline"
            :external="true"
            :icon-right="ArrowTopRightOnSquareIcon"
          >
            {{ $gettext('View Changelog on Docs') }}
          </BrandButton>
        </div>
      </div>

      <div
        v-else
        class="text-center flex flex-col justify-center w-full min-h-[250px] min-w-[280px] sm:min-w-[400px]"
      >
        <BrandLoading class="w-[150px] mx-auto mt-24px" />
        <p>{{ $gettext('Fetching & parsing changelog…') }}</p>
      </div>
    </template>

    <template #footer>
      <div class="flex flex-col-reverse xs:flex-row justify-between gap-12px md:gap-16px">
        <div class="flex flex-col-reverse xs:flex-row xs:justify-start gap-12px md:gap-16px">
          <BrandButton
            variant="underline"
            :icon="XMarkIcon"
            @click="updateOsChangelogStore.setReleaseForUpdate(null)"
          >
            {{ $gettext('Close') }}
          </BrandButton>
          <BrandButton
            v-if="releaseForUpdate?.changelogPretty"
            variant="underline"
            :external="true"
            :href="releaseForUpdate?.changelogPretty"
            :icon="EyeIcon"
            :icon-right="ArrowTopRightOnSquareIcon"
          >
            {{ $gettext('View on Docs') }}
          </BrandButton>
        </div>
        <BrandButton
          v-if="showExtendKeyButton"
          variant="fill"
          :icon="KeyIcon"
          :icon-right="ArrowTopRightOnSquareIcon"
          @click="purchaseStore.renew()"
        >
          {{ $gettext('Extend License to Update') }}
        </BrandButton>
        <BrandButton
          v-else-if="releaseForUpdate?.sha256"
          :icon="ServerStackIcon"
          :icon-right="ArrowSmallRightIcon"
          @click="updateOsChangelogStore.fetchAndConfirmInstall(releaseForUpdate.sha256)"
        >
          {{ $gettext('Continue') }}
        </BrandButton>
      </div>
    </template>
  </Modal>
</template>
