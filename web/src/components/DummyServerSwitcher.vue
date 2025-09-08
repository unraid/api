<script lang="ts" setup>
import { storeToRefs } from 'pinia';

import { Select } from '@unraid/ui';
import { useDummyServerStore } from '~/_data/serverState';

const store = useDummyServerStore();

const { selector, serverState } = storeToRefs(store);

const items = [
  { value: 'default', label: 'Default' },
  { value: 'oemActiviation', label: 'OEM Activation' },
];
</script>

<template>
  <div class="flex flex-col gap-2 border-2 border-r-2 border-solid p-2">
    <h1 class="text-lg">Server State Selection</h1>
    <details>
      <summary>Initial Server State: {{ selector }}</summary>
      <pre>{{ JSON.stringify(serverState, null, 4) }}</pre>
    </details>
    <Select v-model="selector" :items="items" placeholder="Select an initial state" />
  </div>
</template>
