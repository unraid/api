<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { ArrowPathIcon, ArrowTopRightOnSquareIcon, LinkIcon } from '@heroicons/vue/24/solid';
import { Badge, BrandButton } from '@unraid/ui';

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
      variant="none"
      :title="t('Refresh')"
      class="group"
      @click="replaceRenewStore.check(true)"
    >
      <Badge
        v-if="keyLinkedOutput"
        :variant="keyLinkedOutput.variant"
        :icon="keyLinkedOutput.icon"
        :icon-right="ArrowPathIcon"
        size="md"
      >
        {{ t(keyLinkedOutput.text ?? 'Unknown') }}
      </Badge>
    </BrandButton>
    <Badge v-else :variant="keyLinkedOutput.variant" :icon="keyLinkedOutput.icon" size="md">
      {{ t(keyLinkedOutput.text ?? 'Unknown') }}
    </Badge>

    <span class="inline-flex flex-wrap-items-start gap-8px">
      <BrandButton
        v-if="keyLinkedStatus === 'notLinked'"
        variant="underline"
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
        variant="underline"
        :external="true"
        :icon-right="ArrowTopRightOnSquareIcon"
        :text="t('Learn More')"
        class="text-14px"
        @click="accountStore.myKeys"
      />
    </span>
  </div>
</template>
