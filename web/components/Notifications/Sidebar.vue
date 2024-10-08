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
watch(notifications, (newVal) => {
  console.log('[notifications]', newVal);
});

const fetchType = ref<'UNREAD' | 'ARCHIVED'>('UNREAD');
const setFetchType = (type: 'UNREAD' | 'ARCHIVED') => fetchType.value = type;

const { unraidApiClient } = storeToRefs(useUnraidApiStore());

watch(unraidApiClient, async(newVal) => {
  if (newVal) {
    const apiResponse = await newVal.query({
      query: getNotifications,
      variables: {
        filter: {
          offset: 0,
          limit: 10,
          type: fetchType.value,
        },
      },
    });
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

    <SheetContent :to="teleportTarget" class="w-full max-w-[400px] sm:max-w-[540px]">
      <SheetHeader>
        <SheetTitle>Notifications</SheetTitle>
      </SheetHeader>

      <div class="flex flex-row justify-between items-center">
        <div class="w-auto flex flex-row justify-start items-center gap-1 p-2 rounded">
          <Button
            v-for="opt in ['Unread', 'Archived']"
            :key="opt"
            :variant="fetchType === opt ? 'secondary' : undefined"
            class="py-2 px-4 text-left"
            @click="setFetchType(opt.toUpperCase() as 'UNREAD' | 'ARCHIVED')"
          >
            {{ opt }}
          </Button>
        </div>
        <div class="w-auto flex flex-row justify-start items-center gap-1 p-2 rounded">
          <Button
            variant="secondary"
            class="py-2 px-4 text-left"
          >
            {{ `Archive All` }}
          </Button>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent :to="teleportTarget">
              <SelectGroup>
                <SelectLabel>Notification Types</SelectLabel>
                <SelectItem value="alert">Alert</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div class="divide-y divide-gray-200">
        <NotificationsItem
          v-for="notification in notifications"
          :key="notification.id"
          v-bind="notification"
        />
      </div>

      <SheetFooter class="text-center">
        <p>Future pagination station</p>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
