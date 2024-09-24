<script setup lang="ts">
import { useNotificationsStore } from '~/store/notifications';

const notificationsStore = useNotificationsStore();
</script>

<template>
  <BrandButton text="My Button" @click="notificationsStore.toggle" />

  <NotificationsSidebar />
</template>

