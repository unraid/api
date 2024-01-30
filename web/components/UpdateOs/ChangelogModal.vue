<script setup lang="ts">
import {
  ArrowTopRightOnSquareIcon,
  ArrowSmallRightIcon,
  EyeIcon,
  KeyIcon,
  ServerStackIcon,
  XMarkIcon,
} from '@heroicons/vue/24/solid';
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

const { availableWithRenewal } = storeToRefs(updateOsStore);
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

// find all the links in the changelog and make them open in a new tab
const changelogOutput = ref<HTMLElement | null>(null);
const updateChangelogLinks = () => {
  if (!changelogOutput.value) { return; }
  const links = changelogOutput.value.querySelectorAll('a');
  links.forEach((link) => {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    /** @todo what do we do with docusaurus based links? May also be broken on the account app. */
    // if a link is a relative link or doesn't start with http but doesn't start with a # we need to prepend the base url of the changelog
    // const linkIsRelative = link.getAttribute('href')?.startsWith('/') ?? false;
    // const linkIsNotHttp = link.getAttribute('href')?.startsWith('http') === false;
    // const linkIsNotHash = link.getAttribute('href')?.startsWith('#') === false;
    // const linkIsNotAnchor = link.getAttribute('href')?.startsWith('mailto') === false;
    // if (linkIsRelative || (linkIsNotHttp && linkIsNotHash && linkIsNotAnchor)) {
    //   link.setAttribute('href', `${releaseForUpdate.value?.changelog}${link.getAttribute('href')}`);
    // }
  });
};

watchEffect(() => {
  if (mutatedParsedChangelog.value) {
    updateChangelogLinks();
  }
});
</script>

<template>
  <Modal
    :center-content="false"
    :error="!!parseChangelogFailed"
    max-width="max-w-800px"
    :open="!!releaseForUpdate"
    :show-close-x="true"
    :t="t"
    :tall-content="true"
    :title="parsedChangelogTitle ?? undefined"
    @close="updateOsChangelogStore.setReleaseForUpdate(null)"
  >
    <template #main>
      <div
        v-if="mutatedParsedChangelog"
        ref="changelogOutput"
        class="text-18px prose prose-a:text-unraid-red hover:prose-a:no-underline hover:prose-a:text-unraid-red/60 dark:prose-a:text-orange hover:dark:prose-a:text-orange/60"
        v-html="mutatedParsedChangelog"
      />

      <div
        v-else-if="parseChangelogFailed"
        class="text-center flex flex-col gap-4 prose"
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
      <div class="flex flex-col-reverse gap-3 sm:gap-4 sm:flex-row sm:justify-between">
        <div>
          <BrandButton
            v-if="showExternalChangelogLink"
            btn-style="underline"
            :external="true"
            :href="releaseForUpdate?.changelog"
            :icon="EyeIcon"
            :icon-right="ArrowTopRightOnSquareIcon"
          >
            {{ props.t("View Docs") }}
          </BrandButton>
        </div>
        <div class="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 sm:justify-end">
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
              {{ props.t('Continue') }}
            </BrandButton>
          </template>
        </div>
      </div>
    </template>
  </Modal>
</template>
