<script lang="ts" setup>
import { useI18n } from '~/composables/useI18n';
import { storeToRefs } from 'pinia';

import { BrandButton } from '@unraid/ui';

import { useServerStore } from '~/store/server';

const { $gettext } = useI18n();

const serverStore = useServerStore();
const { authAction, stateData } = storeToRefs(serverStore);
</script>

<template>
  <div class="whitespace-normal flex flex-col gap-y-16px max-w-3xl">
    <span v-if="stateData.error" class="text-unraid-red font-semibold">
      <h3 class="text-16px mb-8px">{{ $gettext(stateData.heading) }}</h3>
      <span class="text-14px" v-html="$gettext(stateData.message)" />
    </span>
    <span v-if="authAction">
      <BrandButton
        :disabled="authAction?.disabled"
        :icon="authAction.icon"
        size="12px"
        :text="$gettext(authAction.text)"
        :title="authAction?.title ? $gettext(authAction?.title) : undefined"
        @click="authAction.click?.()"
      />
    </span>
  </div>
</template>

<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
@import '~/assets/main.css';
</style>
