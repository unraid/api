<script setup lang="ts">
import { BellIcon } from "@heroicons/vue/24/solid";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/shadcn/sheet";

import type { NotificationItemProps } from "~/types/ui/notification";
import { useUnraidApiStore } from "~/store/unraidApi";
import gql from "graphql-tag";

const getNotifications = gql`
    query Notifications($filter: NotificationFilter!) {
      notifications {
        list(filter: $filter) {
          id
          title
          subject
          description
          importance
          link
          type
          timestamp
        }
      }
    }
`;

const notifications = ref<NotificationItemProps[]>([]);

const { unraidApiClient } = storeToRefs(useUnraidApiStore());

watch(unraidApiClient, async(newVal) => {
  if (newVal) {
    const apiResponse = await newVal.query({
      query: getNotifications,
      variables: {
        filter: {
          offset: 0,
          limit: 10,
          type: 'UNREAD',
        },
      },
    });
    console.log('[blah blah]', apiResponse);

    notifications.value = apiResponse.data.notifications.list;
  }
});

const { teleportTarget, determineTeleportTarget } = useTeleport();
</script>

<template>
  <Sheet>
    <SheetTrigger @click="determineTeleportTarget">
      <span class="sr-only">Notifications</span>
      <BellIcon class="w-6 h-6" />
    </SheetTrigger>

    <SheetContent :to="teleportTarget" class="w-full max-w-[400px] sm:max-w-[540px] bg-beta text-alpha">
      <SheetHeader>
        <SheetTitle>Notifications</SheetTitle>
      </SheetHeader>

      <Tabs default-value="unread">
        <TabsList>
          <TabsTrigger value="unread">
            Unread
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unread" class="divide-y divide-gray-200">
          <NotificationsItem
            v-for="notification in notifications"
            :key="notification.id"
            v-bind="notification"
          />
        </TabsContent>
        <TabsContent value="archived" class="divide-y divide-gray-200">
          <NotificationsItem
            v-for="notification in archiveNotifications"
            :key="notification.id"
            v-bind="notification"
          />
        </TabsContent>
      </Tabs>

      <SheetFooter>
        <p>Future pagination station</p>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
