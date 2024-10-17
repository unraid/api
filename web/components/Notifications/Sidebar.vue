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

import {
  getNotifications,
  NOTIFICATION_FRAGMENT,
} from "./graphql/notification.query";
import {
  NotificationType,
} from "~/composables/gql/graphql";
import { useFragment } from "~/composables/gql/fragment-masking";
import { useQuery } from "@vue/apollo-composable";

// const notifications = ref<NotificationFragmentFragment[]>([]);
// watch(notifications, (newVal) => {
//   console.log("[notifications]", newVal);
// });

const fetchType = ref<NotificationType>(NotificationType.Unread);
const setFetchType = (type: NotificationType) => (fetchType.value = type);

const { result, error } = useQuery(getNotifications, {
  filter: {
    offset: 0,
    limit: 10,
    type: fetchType.value,
  },
});

const notifications = computed(() => {
  if (!result.value?.notifications.list) return [];
  return useFragment(NOTIFICATION_FRAGMENT, result.value?.notifications.list);
});

watch(error, (newVal) => {
  console.log("[sidebar error]", newVal);
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
      class="w-full overflow-y-scroll sm:max-w-[540px] space-y-3"
    >
      <SheetHeader>
        <SheetTitle>Notifications</SheetTitle>
      </SheetHeader>

      <Tabs default-value="unread" class="">
        <div class="flex flex-row justify-between items-center flex-wrap gap-2">
          <TabsList class="ml-[1px]">
            <TabsTrigger
              class=""
              value="unread"
              @click="setFetchType(NotificationType.Unread)"
            >
              Unread
            </TabsTrigger>
            <TabsTrigger
              class=""
              value="archived"
              @="setFetchType(NotificationType.Archive)"
            >
              Archived
            </TabsTrigger>
          </TabsList>

          <Button
            variant="link"
            size="sm"
            class="text-muted-foreground text-base p-0"
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

        <TabsContent class="mt-3" value="unread">
          <div
              v-if="notifications?.length > 0"
              class="divide-y divide-gray-200"
            >
              <NotificationsItem
                v-for="notification in notifications"
                :key="notification.id"
                v-bind="notification"
              />
            </div>
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