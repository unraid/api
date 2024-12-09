<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable';
import { notificationsOverview } from './graphql/notification.query';

const { result } = useQuery(notificationsOverview);

const overview = computed(() => {
  if (!result.value) {
    return;
  }
  return result.value.notifications.overview;
});
</script>

<template>
  <TabsList>
    <TabsTrigger value="unread">
      Unread <span v-if="overview">({{ overview.unread.total }})</span>
    </TabsTrigger>
    <TabsTrigger value="archived">
      Archived <span v-if="overview">({{ overview.archive.total }})</span>
    </TabsTrigger>
  </TabsList>
</template>
