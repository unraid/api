<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { ArrowTopRightOnSquareIcon, KeyIcon } from '@heroicons/vue/24/solid';
import { Badge, BrandButton } from '@unraid/ui';
import { DOCS_REGISTRATION_REPLACE_KEY } from '~/helpers/urls';

import type { ComposerTranslation } from 'vue-i18n';

import { useReplaceRenewStore } from '~/store/replaceRenew';

const replaceRenewStore = useReplaceRenewStore();
const { replaceStatusOutput } = storeToRefs(replaceRenewStore);

defineProps<{
  t: ComposerTranslation;
}>();
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-2">
    <BrandButton
      v-if="!replaceStatusOutput"
      :icon="KeyIcon"
      :text="t('Check Eligibility')"
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
        :text="t('Learn More')"
        class="text-sm"
      />
    </span>
  </div>
</template>
