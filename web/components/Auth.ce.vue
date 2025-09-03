<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import { BrandButton } from '@unraid/ui';

import { useServerStore } from '~/store/server';

const { t } = useI18n();

const serverStore = useServerStore();
const { authAction, stateData } = storeToRefs(serverStore);
</script>

<template>
  <div class="whitespace-normal flex flex-col gap-y-4 max-w-3xl">
    <span v-if="stateData?.error" class="text-unraid-red font-semibold">
      <h3 class="text-base mb-2">{{ stateData?.heading ? t(stateData.heading) : '' }}</h3>
      <span class="text-sm" v-html="stateData?.message ? t(stateData.message) : ''" />
    </span>
    <span v-if="authAction">
      <BrandButton
        :disabled="authAction?.disabled"
        :icon="authAction.icon"
        size="12px"
        :text="t(authAction.text)"
        :title="authAction?.title ? t(authAction?.title) : undefined"
        @click="authAction.click?.()"
      />
    </span>
  </div>
</template>
