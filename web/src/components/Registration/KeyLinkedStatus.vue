<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import { ArrowPathIcon, ArrowTopRightOnSquareIcon, LinkIcon } from '@heroicons/vue/24/solid';
import { Badge, BrandButton } from '@unraid/ui';

import { useAccountStore } from '~/store/account';
import { useReplaceRenewStore } from '~/store/replaceRenew';

const { t } = useI18n();
const accountStore = useAccountStore();
const replaceRenewStore = useReplaceRenewStore();
const { keyLinkedStatus, keyLinkedOutput } = storeToRefs(replaceRenewStore);
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-2">
    <BrandButton
      v-if="keyLinkedStatus !== 'linked' && keyLinkedStatus !== 'checking'"
      variant="none"
      :title="t('registration.keyLinkedStatus.refresh')"
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

    <span class="flex-wrap-items-start inline-flex gap-2">
      <BrandButton
        v-if="keyLinkedStatus === 'notLinked'"
        variant="underline"
        :external="true"
        :icon="LinkIcon"
        :icon-right="ArrowTopRightOnSquareIcon"
        :text="t('registration.keyLinkedStatus.linkKey')"
        :title="t('registration.keyLinkedStatus.learnMoreAndLinkYourKey')"
        class="text-sm"
        @click="accountStore.linkKey"
      />
      <BrandButton
        v-else
        variant="underline"
        :external="true"
        :icon-right="ArrowTopRightOnSquareIcon"
        :text="t('registration.keyLinkedStatus.learnMore')"
        class="text-sm"
        @click="accountStore.myKeys"
      />
    </span>
  </div>
</template>
