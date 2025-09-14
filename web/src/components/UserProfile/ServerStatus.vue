<script setup lang="ts">
import { cn } from '@unraid/ui';

import type { ClassValue } from '@unraid/ui';

import UpcServerState from '~/components/UserProfile/ServerState.vue';
import UpcUptimeExpire from '~/components/UserProfile/UptimeExpire.vue';
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
    <UpcUptimeExpire :as="'span'" :short-text="true" class="text-xs" />
    <span class="xs:!inline hidden">&bull;</span>
    <UpcServerState class="text-xs" />
  </div>
</template>
