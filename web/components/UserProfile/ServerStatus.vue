<script setup lang="ts">
import { cn, type ClassValue } from '@unraid/ui';
import UpcUptimeExpire from './UptimeExpire.vue';
import UpcServerState from './ServerState.vue';
</script>

<template>
  <div
    :class="
      cn(
        'text-header-text-secondary font-semibold leading-tight',
        'flex flex-col items-end gap-y-0.5 justify-end',
        'xs:flex-row xs:items-baseline xs:gap-x-2 xs:gap-y-0',
        'text-xs',
        $attrs.class as ClassValue
      )
    "
  >
    <UpcUptimeExpire :as="'span'" :short-text="true" class="text-xs" />
    <span class="hidden xs:inline">&bull;</span>
    <UpcServerState class="text-xs" />
  </div>
</template>
