<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { ArrowPathIcon, ArrowTopRightOnSquareIcon, LinkIcon } from '@heroicons/vue/24/solid';
import { Badge, BrandButton } from '@unraid/ui';

import { useI18n } from '~/composables/useI18n';
import { useAccountStore } from '~/store/account';
import { useReplaceRenewStore } from '~/store/replaceRenew';

const { $gettext } = useI18n();
const accountStore = useAccountStore();
const replaceRenewStore = useReplaceRenewStore();
const { keyLinkedStatus, keyLinkedOutput } = storeToRefs(replaceRenewStore);
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-8px">
    <BrandButton
      v-if="keyLinkedStatus !== 'linked' && keyLinkedStatus !== 'checking'"
      variant="none"
      :title="$gettext('Refresh')"
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
        {{ $gettext(keyLinkedOutput.text ?? 'Unknown') }}
      </Badge>
    </BrandButton>
    <Badge v-else :variant="keyLinkedOutput.variant" :icon="keyLinkedOutput.icon" size="md">
      {{ $gettext(keyLinkedOutput.text ?? 'Unknown') }}
    </Badge>

    <span class="inline-flex flex-wrap-items-start gap-8px">
      <BrandButton
        v-if="keyLinkedStatus === 'notLinked'"
        variant="underline"
        :external="true"
        :icon="LinkIcon"
        :icon-right="ArrowTopRightOnSquareIcon"
        :text="$gettext('Link Key')"
        :title="$gettext('Learn more and link your key to your account')"
        class="text-14px"
        @click="accountStore.linkKey"
      />
      <BrandButton
        v-else
        variant="underline"
        :external="true"
        :icon-right="ArrowTopRightOnSquareIcon"
        :text="$gettext('Learn More')"
        class="text-14px"
        @click="accountStore.myKeys"
      />
    </span>
  </div>
</template>
