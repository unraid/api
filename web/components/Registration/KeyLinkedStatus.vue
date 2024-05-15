<script setup lang="ts">
import {
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  LinkIcon,
} from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';
import type { ComposerTranslation } from 'vue-i18n';

import { useAccountStore } from '~/store/account';
import { useReplaceRenewStore } from '~/store/replaceRenew';

const accountStore = useAccountStore();
const replaceRenewStore = useReplaceRenewStore();
const { keyLinkedStatus, keyLinkedOutput } = storeToRefs(replaceRenewStore);

defineProps<{
  t: ComposerTranslation;
}>();
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-8px">
    <BrandButton
      v-if="keyLinkedStatus !== 'linked' && keyLinkedStatus !== 'checking'"
      btn-style="none"
      :no-padding="true"
      :title="t('Refresh')"
      class="group"
      @click="replaceRenewStore.check(true)"
    >
      <UiBadge
        v-if="keyLinkedOutput"
        :color="keyLinkedOutput.color"
        :icon="keyLinkedOutput.icon"
        :icon-right="ArrowPathIcon"
        size="16px"
      >
        {{ t(keyLinkedOutput.text ?? 'Unknown') }}
      </UiBadge>
    </BrandButton>
    <UiBadge
      v-else
      :color="keyLinkedOutput.color"
      :icon="keyLinkedOutput.icon"
      size="16px"
    >
      {{ t(keyLinkedOutput.text ?? 'Unknown') }}
    </UiBadge>

    <span class="inline-flex flex-wrap-items-start gap-8px">
      <BrandButton
        v-if="keyLinkedStatus === 'notLinked'"
        btn-style="underline"
        :external="true"
        :icon="LinkIcon"
        :icon-right="ArrowTopRightOnSquareIcon"
        :text="t('Link Key')"
        :title="t('Learn more and link your key to your account')"
        class="text-14px"
        @click="accountStore.linkKey"
      />
      <BrandButton
        v-else
        btn-style="underline"
        :external="true"
        :icon-right="ArrowTopRightOnSquareIcon"
        :text="t('Learn More')"
        class="text-14px"
        @click="accountStore.myKeys"
      />
    </span>
  </div>
</template>
