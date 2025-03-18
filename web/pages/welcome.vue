<script setup lang="ts">
import { useDummyServerStore } from '~/_data/serverState';

import DummyServerSwitcher from '~/components/DummyServerSwitcher.vue';
const serverStore = useDummyServerStore();
const { serverState } = storeToRefs(serverStore);
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <DummyServerSwitcher />
    <WelcomeModalCe :server="serverState ?? undefined" />
  </div>
</template>
