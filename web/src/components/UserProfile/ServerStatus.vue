<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { cn } from '@unraid/ui';

import type { ClassValue } from '@unraid/ui';

import UpcServerState from '~/components/UserProfile/ServerState.vue';
import UpcUptimeExpire from '~/components/UserProfile/UptimeExpire.vue';
import { useServerStore } from '~/store/server';

const { state, uptime, expireTime } = storeToRefs(useServerStore());
// The date helper captures its starting timestamp. Refresh it when server data
// changes from uptime to a trial expiry (or the expiry itself changes).
const uptimeKey = computed(() => `${state.value}:${uptime.value}:${expireTime.value}`);
</script>

<template>
  <div
    :class="
      cn(
        'text-header-text-secondary leading-tight font-semibold',
        'flex flex-col items-end justify-end gap-y-0.5',
        'xs:!flex-row xs:items-baseline xs:gap-x-2 xs:gap-y-0',
        'text-xs',
        $attrs.class as ClassValue
      )
    "
  >
    <UpcUptimeExpire :key="uptimeKey" :as="'span'" :short-text="true" class="text-xs" />
    <span class="xs:!inline hidden">&bull;</span>
    <UpcServerState class="text-xs" />
  </div>
</template>
