<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { storeToRefs } from 'pinia';

import {
  ArrowSmallRightIcon,
  ArrowTopRightOnSquareIcon,
  ArrowLeftIcon,
  KeyIcon,
  ServerStackIcon,
} from '@heroicons/vue/24/solid';
import { BrandButton, BrandLoading } from '@unraid/ui';

import type { ComposerTranslation } from 'vue-i18n';

import { usePurchaseStore } from '~/store/purchase';
import { useUpdateOsStore } from '~/store/updateOs';
// import { useUpdateOsActionsStore } from '~/store/updateOsActions';
import { useUpdateOsChangelogStore } from '~/store/updateOsChangelog';

export interface Props {
  open?: boolean;
  t: ComposerTranslation;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
});

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

// iframe navigation handling
const iframeRef = ref<HTMLIFrameElement | null>(null);
const hasNavigated = ref(false);
const currentIframeUrl = ref<string | null>(null);

const docsChangelogUrl = computed(() => {
  return releaseForUpdate.value?.changelogPretty ?? null;
});

const showRawChangelog = computed<boolean>(() => {
  return !docsChangelogUrl.value && Boolean(mutatedParsedChangelog.value);
});

const handleIframeNavigationMessage = (event: MessageEvent) => {
  if (
    event.data &&
    event.data.type === "unraid-docs-navigation" &&
    iframeRef.value &&
    event.source === iframeRef.value.contentWindow
  ) {
    if (event.data.url !== docsChangelogUrl.value) {
      hasNavigated.value = true;
    } else {
      hasNavigated.value = false;
    }
    currentIframeUrl.value = event.data.url;
  }
};

onMounted(() => {
  window.addEventListener("message", handleIframeNavigationMessage);
  // Set initial value
  currentIframeUrl.value = docsChangelogUrl.value;
});

onBeforeUnmount(() => {
  window.removeEventListener("message", handleIframeNavigationMessage);
});

const revertToInitialChangelog = () => {
  if (iframeRef.value && docsChangelogUrl.value) {
    iframeRef.value.src = docsChangelogUrl.value;
    hasNavigated.value = false;
    currentIframeUrl.value = docsChangelogUrl.value;
  }
};

watch(docsChangelogUrl, (newUrl) => {
  currentIframeUrl.value = newUrl;
  hasNavigated.value = false;
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
      <div class="flex flex-col gap-4 min-w-[280px] sm:min-w-[400px]">
        <!-- iframe for changelog if available -->
        <div
          v-if="docsChangelogUrl"
          class="w-[calc(100%+3rem)] h-[475px] -mx-6 -my-6"
        >
          <iframe
            ref="iframeRef"
            :src="docsChangelogUrl"
            class="w-full h-full border-0 rounded-md"
            sandbox="allow-scripts allow-same-origin"
            title="Unraid Changelog"
          ></iframe>
        </div>

        <!-- Fallback to raw changelog -->
        <div
          v-else-if="showRawChangelog"
          class="text-16px sm:text-18px prose prose-a:text-unraid-red hover:prose-a:no-underline hover:prose-a:text-unraid-red/60 dark:prose-a:text-orange hover:dark:prose-a:text-orange/60 overflow-auto max-h-[500px]"
          v-html="mutatedParsedChangelog"
        />
  
        <!-- Error state -->
        <div v-else-if="parseChangelogFailed" class="text-center flex flex-col gap-4 prose">
          <h2 class="text-lg text-unraid-red italic font-semibold">
            {{ props.t(`Error Parsing Changelog • {0}`, [parseChangelogFailed]) }}
          </h2>
          <p>
            {{ props.t(`It's highly recommended to review the changelog before continuing your update`) }}
          </p>
          <div v-if="releaseForUpdate?.changelogPretty" class="flex self-center">
            <BrandButton
              :href="releaseForUpdate?.changelogPretty"
              variant="underline"
              :external="true"
              :icon-right="ArrowTopRightOnSquareIcon"
            >
              {{ props.t('View Changelog on Docs') }}
            </BrandButton>
          </div>
        </div>
  
        <!-- Loading state -->
        <div
          v-else
          class="text-center flex flex-col justify-center w-full min-h-[250px] min-w-[280px] sm:min-w-[400px]"
        >
          <BrandLoading class="w-[150px] mx-auto mt-24px" />
          <p>{{ props.t('Fetching & parsing changelog…') }}</p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex flex-col-reverse xs:flex-row justify-between gap-12px md:gap-16px">
        <div class="flex flex-col-reverse xs:flex-row xs:justify-start gap-12px md:gap-16px">
          <!-- Back to changelog button (when navigated away) -->
          <BrandButton
            v-if="hasNavigated && docsChangelogUrl"
            variant="underline"
            :icon="ArrowLeftIcon"
            aria-label="Back to Changelog"
            @click="revertToInitialChangelog"
          />
          
          <!-- View on docs button -->
          <BrandButton
            v-if="currentIframeUrl || releaseForUpdate?.changelogPretty"
            variant="underline"
            :external="true"
            :href="currentIframeUrl || releaseForUpdate?.changelogPretty"
            :icon="ArrowTopRightOnSquareIcon"
            aria-label="View on Docs"
          />
        </div>
        
        <!-- Action buttons -->
        <BrandButton
          v-if="showExtendKeyButton"
          variant="fill"
          :icon="KeyIcon"
          :icon-right="ArrowTopRightOnSquareIcon"
          @click="purchaseStore.renew()"
        >
          {{ props.t('Extend License to Update') }}
        </BrandButton>
        <BrandButton
          v-else-if="releaseForUpdate?.sha256"
          :icon="ServerStackIcon"
          :icon-right="ArrowSmallRightIcon"
          @click="updateOsChangelogStore.fetchAndConfirmInstall(releaseForUpdate.sha256)"
        >
          {{ props.t('Continue') }}
        </BrandButton>
      </div>
    </template>
  </Modal>
</template>
