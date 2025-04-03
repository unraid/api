<script lang="ts" setup>
import { storeToRefs } from 'pinia';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@unraid/ui';
import { useDummyServerStore } from '~/_data/serverState';

import type { ServerSelector } from '~/_data/serverState';

// Define the same type locally as in reka-ui
type AcceptableValue = string | number | Record<string, unknown> | null;

const store = useDummyServerStore();
const { selector, serverState } = storeToRefs(store);

const updateSelector = (val: AcceptableValue) => {
  if (typeof val === 'string') {
    selector.value = val as ServerSelector;
  }
};
</script>

<template>
  <div class="flex flex-col gap-2 border-solid border-2 p-2 border-r-2">
    <h1 class="text-lg">Server State Selection</h1>
    <details>
      <summary>Initial Server State: {{ selector }}</summary>
      <pre>{{ JSON.stringify(serverState, null, 4) }}</pre>
    </details>
    <Select v-model="selector" @update:model-value="updateSelector">
      <SelectTrigger>
        <SelectValue placeholder="Select an initial state" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="default">Default</SelectItem>
        <SelectItem value="oemActiviation">OEM Activation</SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>

<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
@import '~/assets/main.css';
</style>
