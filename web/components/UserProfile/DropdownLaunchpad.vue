<script lang="ts" setup>
import { BrandButton, BrandLoading } from '@unraid/ui';
import { useServerStore } from '~/store/server';
import { useUnraidApiStore } from '~/store/unraidApi';
import { storeToRefs } from 'pinia';
import { h } from 'vue';
import type { ComposerTranslation } from 'vue-i18n';

defineProps<{ t: ComposerTranslation }>();

const { expireTime, connectPluginInstalled, state, stateData } = storeToRefs(useServerStore());
const { unraidApiStatus, unraidApiRestartAction } = storeToRefs(useUnraidApiStore());

const showExpireTime = computed(
  () => (state.value === 'TRIAL' || state.value === 'EEXPIRED') && expireTime.value > 0
);
</script>

<template>
  <div class="flex flex-col gap-y-24px w-full min-w-300px md:min-w-[500px] max-w-xl p-16px">
    <header>
      <h2 class="text-24px text-center font-semibold" v-html="t(stateData.heading)" />
      <div
        class="text-center prose text-16px leading-relaxed whitespace-normal opacity-75 gap-y-8px"
        v-html="t(stateData.message)"
      />
      <UpcUptimeExpire v-if="showExpireTime" class="text-center opacity-75 mt-12px" :t="t" />
    </header>
    <template v-if="stateData.actions">
      <ul
        v-if="connectPluginInstalled && unraidApiStatus !== 'online'"
        class="list-reset flex flex-col gap-y-8px px-16px"
      >
        <li>
          <BrandButton
            class="w-full"
            :disabled="unraidApiStatus === 'connecting' || unraidApiStatus === 'restarting'"
            :icon="
              unraidApiStatus === 'restarting'
                ? h(BrandLoading, { variant: 'white' })
                : unraidApiRestartAction?.icon
            "
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

<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
@import '../../assets/main.css';

.DropdownWrapper_blip {
  box-shadow: var(--ring-offset-shadow), var(--ring-shadow), var(--shadow-foreground);

  &::before {
    @apply absolute z-20 block;

    content: '';
    width: 0;
    height: 0;
    top: -10px;
    right: 42px;
    border-right: 11px solid transparent;
    border-bottom: 11px solid var(--color-popover);
    border-left: 11px solid transparent;
  }
}

.unraid_mark_2,
.unraid_mark_4 {
  animation: mark_2 1.5s ease infinite;
}
.unraid_mark_3 {
  animation: mark_3 1.5s ease infinite;
}
.unraid_mark_6,
.unraid_mark_8 {
  animation: mark_6 1.5s ease infinite;
}
.unraid_mark_7 {
  animation: mark_7 1.5s ease infinite;
}

@keyframes mark_2 {
  50% {
    transform: translateY(-40px);
  }
  100% {
    transform: translateY(0);
  }
}
@keyframes mark_3 {
  50% {
    transform: translateY(-62px);
  }
  100% {
    transform: translateY(0);
  }
}
@keyframes mark_6 {
  50% {
    transform: translateY(40px);
  }
  100% {
    transform: translateY(0);
  }
}
@keyframes mark_7 {
  50% {
    transform: translateY(62px);
  }
  100% {
    transform: translateY(0);
  }
}
</style>
