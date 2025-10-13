<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import { ArrowTopRightOnSquareIcon, KeyIcon } from '@heroicons/vue/24/solid';
import { Badge, BrandButton } from '@unraid/ui';
import { DOCS_REGISTRATION_REPLACE_KEY } from '~/helpers/urls';

import { useReplaceRenewStore } from '~/store/replaceRenew';

const { t } = useI18n();
const replaceRenewStore = useReplaceRenewStore();
const { replaceStatusOutput } = storeToRefs(replaceRenewStore);
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-2">
    <BrandButton
      v-if="!replaceStatusOutput"
      :icon="KeyIcon"
      :text="t('registration.replaceCheck.checkEligibility')"
      class="grow"
      @click="replaceRenewStore.check"
    />

    <Badge v-else :variant="replaceStatusOutput.variant" :icon="replaceStatusOutput.icon" size="md">
      {{ t(replaceStatusOutput.text ?? 'Unknown') }}
    </Badge>

    <span class="inline-flex flex-wrap items-center justify-end gap-2">
      <BrandButton
        variant="underline"
        :external="true"
        :href="DOCS_REGISTRATION_REPLACE_KEY.toString()"
        :icon-right="ArrowTopRightOnSquareIcon"
        :text="t('registration.keyLinkedStatus.learnMore')"
        class="text-sm"
      />
    </span>
  </div>
</template>
