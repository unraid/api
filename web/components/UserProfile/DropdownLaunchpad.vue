<script lang="ts" setup>
import { computed, h } from 'vue';
import { storeToRefs } from 'pinia';

import { BrandButton, BrandLoading } from '@unraid/ui';

import type { ComposerTranslation } from 'vue-i18n';

import { useServerStore } from '~/store/server';
import { useUnraidApiStore } from '~/store/unraidApi';
import UpcUptimeExpire from './UptimeExpire.vue';
import KeyActions from '~/components/KeyActions.vue';

defineProps<{ t: ComposerTranslation }>();

const BrandLoadingIcon = () => h(BrandLoading, { variant: 'white' });

const { expireTime, connectPluginInstalled, state, stateData } = storeToRefs(useServerStore());
const { unraidApiStatus, unraidApiRestartAction } = storeToRefs(useUnraidApiStore());

const showExpireTime = computed(
  () => (state.value === 'TRIAL' || state.value === 'EEXPIRED') && expireTime.value > 0
);
</script>

<template>
  <div class="flex flex-col grow gap-y-6 p-4">
    <header>
      <h2 class="text-2xl text-center font-semibold" v-html="t(stateData.heading)" />
      <div
        class="text-center prose text-base leading-relaxed whitespace-normal opacity-75 gap-y-2"
        v-html="t(stateData.message)"
      />
      <UpcUptimeExpire v-if="showExpireTime" class="text-center opacity-75 mt-3" :t="t" />
    </header>
    <template v-if="stateData.actions">
      <ul
        v-if="connectPluginInstalled && unraidApiStatus !== 'online'"
        class="list-reset flex flex-col gap-y-2 px-4"
      >
        <li>
          <BrandButton
            class="w-full"
            :disabled="unraidApiStatus === 'connecting' || unraidApiStatus === 'restarting'"
            :icon="unraidApiStatus === 'restarting' ? BrandLoadingIcon : unraidApiRestartAction?.icon"
            :text="
              unraidApiStatus === 'restarting' ? t('Restarting unraid-api…') : t('Restart unraid-api')
            "
            :title="
              unraidApiStatus === 'restarting' ? t('Restarting unraid-api…') : t('Restart unraid-api')
            "
            @click="unraidApiRestartAction?.click?.()"
          />
        </li>
      </ul>
      <KeyActions :actions="stateData.actions" :t="t" />
    </template>
  </div>
</template>
