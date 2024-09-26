<script setup lang="ts">
import { BellIcon } from "@heroicons/vue/24/solid";
import type { NotificationItemProps } from "~/types/ui/notification";

const unreadNotifications: NotificationItemProps[] = [
  {
    date: "2021-10-01 12:03",
    id: "1",
    event: "Unraid.net Account",
    subject: "New User Registration",
    message: "A new user has registered on your platform.",
    type: "success",
    view: "#hello",
  },
  {
    date: "2021-10-01 12:03",
    id: "2",
    event: "Unraid Health",
    subject: "Drive Pre-Failure Detected",
    message: "Drive 1 has been detected as pre-failure.",
    type: "alert",
  },
  {
    date: "2021-10-01 12:03",
    id: "3",
    event: "Unraid Health",
    subject: "Server Maintenance",
    message: "Your server will be undergoing maintenance at 12:00 AM.",
    type: "warning",
  },
];

// const archiveNotifications: NotificationItemProps[] = [
//   {
//     id: "1",
//     subject: "Archived New User Registration",
//     message: "A new user has registered on your platform.",
//     type: "success",
//   },
//   {
//     id: "2",
//     subject: "Archived Drive Pre-Failure Detected",
//     message: "Drive 1 has been detected as pre-failure.",
//     type: "alert",
//   },
//   {
//     id: "3",
//     subject: "Archived Server Maintenance",
//     message: "Your server will be undergoing maintenance at 12:00 AM.",
//     type: "warning",
//   },
// ];
</script>

<template>
  <div>
    <DaisyUiDrawer :title="`Notifications`" :content-padding="false">
      <template #trigger>
        <DaisyUiTooltip position="bottom" text="View Notifications">
          <BellIcon class="size-6" />
        </DaisyUiTooltip>
      </template>
      <template #content>
        <div class="divide-y">
          <NotificationsItem
            v-for="notification in unreadNotifications"
            :key="notification.id"
            v-bind="notification"
          />
        </div>
      </template>
    </DaisyUiDrawer>
  </div>
</template>
