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
  console.log("[notifications]", newVal);
});

const fetchType = ref<"UNREAD" | "ARCHIVED">("UNREAD");
const setFetchType = (type: "UNREAD" | "ARCHIVED") => (fetchType.value = type);

const { unraidApiClient: maybeApi } = storeToRefs(useUnraidApiStore());


watch(maybeApi, async (apiClient) => {
  if (apiClient) {
    const apiResponse = await apiClient.query({
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

    <SheetContent
      :to="teleportTarget"
      class="w-full overflow-y-scroll max-w-[400px] sm:max-w-[540px]"
    >
      <SheetHeader>
        <SheetTitle>Notifications</SheetTitle>
      </SheetHeader>

      <Tabs default-value="unread" class="">
        <div class="flex flex-row justify-between items-center flex-wrap gap-2">
          <TabsList class="ml-[1px]">
            <TabsTrigger
              class="text-[1rem] leading-[1.3rem]"
              value="unread"
              @click="setFetchType('UNREAD')"
            >
              Unread
            </TabsTrigger>
            <TabsTrigger
              class="text-[1rem] leading-[1.3rem]"
              value="archived"
              @="setFetchType('ARCHIVED')"
            >
              Archived
            </TabsTrigger>
          </TabsList>

          <Button
            variant="link"
            size="sm"
            class="text-muted-foreground text-[1rem] leading-[1.3rem] p-0"
          >
            {{ `Archive All` }}
          </Button>

          <Select>
            <SelectTrigger class="bg-secondary border-0 h-auto">
              <SelectValue class="text-muted-foreground" placeholder="Filter" />
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

        <TabsContent value="unread">
          <ScrollArea>
            <div class="divide-y divide-gray-200">
              <NotificationsItem
                v-for="notification in notifications"
                :key="notification.id"
                v-bind="notification"
              />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="archived">
          <p>Archived</p>
        </TabsContent>
      </Tabs>

      <SheetFooter class="text-center">
        <p>Future pagination station</p>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
