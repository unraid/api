<script lang="ts" setup>
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@unraid/ui';
import { useDummyServerStore } from '~/_data/serverState';

const store = useDummyServerStore();
const { selector, serverState } = storeToRefs(store);

const updateSelector = (val: string) => {
  console.log('typeof selector', typeof selector);
  console.log('new dummy server state:', val);
  selector.value = val;
};
</script>

<template>
  <div class="flex flex-col gap-2 border-solid border-2 p-2 border-r-2">
    <h1 class="text-lg">Server State Selection</h1>
    <details>
      <summary>Initial Server State: {{ selector }}</summary>
      <pre>{{ JSON.stringify(serverState, null, 4) }}</pre>
    </details>
    <!-- <select v-model="selector">
    <option value="default">Default</option>
    <option value="oemActivation">OEM Activation</option>
    </select> -->
    <Select v-model="selector" @update:model-value="updateSelector">
      <SelectTrigger>
        <SelectValue placeholder="Select an initial state" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="default">Default</SelectItem>
        <SelectItem value="oemActivation">OEM Activation</SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>

<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
@import '../assets/main.css';
</style>
