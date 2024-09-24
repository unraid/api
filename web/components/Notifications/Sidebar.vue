<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { useNotificationsStore } from '~/store/notifications';

const notificationsStore = useNotificationsStore();
const { isOpen } = storeToRefs(notificationsStore);
</script>

<template>
  <div v-if="isOpen" class="h-full w-full max-w-36">
    This is my sidebar
  </div>
</template>
