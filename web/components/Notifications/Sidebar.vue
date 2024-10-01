<script setup lang="ts">
import { BellIcon } from "@heroicons/vue/24/solid";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/shadcn/sheet";

import type { NotificationItemProps } from "~/types/ui/notification";

const unreadNotifications: NotificationItemProps[] = [
  {
    date: '2024-09-30 15:30',
    event: 'Test Event Type',
    id: "1",
    message: "A new user has registered on your platform.",
    subject: "New User Registration",
    type: "success",
    view: '#my-url',
  },
  {
    date: '2024-09-30 15:30',
    event: 'Test Event Type',
    id: "2",
    message: "Drive 1 has been detected as pre-failure.",
    subject: "Drive Pre-Failure Detected",
    type: "alert",
    view: '#my-url',
  },
  {
    date: '2024-09-30 15:30',
    event: 'Test Event Type',
    id: "3",
    message: "Your server will be undergoing maintenance at 12:00 AM.",
    subject: "Server Maintenance",
    type: "warning",
    view: '#my-url',
  },
];

// const archiveNotifications: NotificationItemProps[] = [
//   {
//     date: '2024-09-30 15:30',
//     event: 'Test Event Type',
//     id: "1",
//     message: "A new user has registered on your platform.",
//     subject: "Archived New User Registration",
//     type: "success",
//     view: '#my-url',
//   },
//   {
//     date: '2024-09-30 15:30',
//     event: 'Test Event Type',
//     id: "2",
//     message: "Drive 1 has been detected as pre-failure.",
//     subject: "Archived Drive Pre-Failure Detected",
//     type: "alert",
//     view: '#my-url',
//   },
//   {
//     date: '2024-09-30 15:30',
//     event: 'Test Event Type',
//     id: "3",
//     message: "Your server will be undergoing maintenance at 12:00 AM.",
//     subject: "Archived Server Maintenance",
//     type: "warning",
//     view: '#my-url',
//   },
// ];

const teleportTarget = ref<string | HTMLElement | Element>("#modals");
const determineTeleportTarget = () => {
  const myModalsComponent = document.querySelector("unraid-modals");
  if (!myModalsComponent?.shadowRoot) return;

  const potentialTarget = myModalsComponent.shadowRoot.querySelector("#modals");
  if (!potentialTarget) return;

  teleportTarget.value = potentialTarget;
  console.log("[determineTeleportTarget] teleportTarget", teleportTarget.value);
};
onMounted(() => {
  determineTeleportTarget();
});
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
        <SheetDescription>What to do about a tab component? Two options break the webgui…</SheetDescription>
      </SheetHeader>

      <div class="divide-y divide-gray-200">
        <NotificationsItem
          v-for="notification in unreadNotifications"
          :key="notification.id"
          v-bind="notification"
        />
      </div>

      <!-- shadcn tabs break the webgui -->
      <!-- <Tabs default-value="unread">
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
            v-for="notification in unreadNotifications"
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
      </Tabs> -->

      <!-- headless ui tabs also break the webgui -->
      <!-- <TabGroup>
        <TabList>
          <Tab>Unread</Tab>
          <Tab>Archived</Tab>
        </TabList>
        <TabPanels>
          <TabPanel class="divide-y divide-gray-200">
            <NotificationsItem
              v-for="notification in unreadNotifications"
              :key="notification.id"
              v-bind="notification"
            />
          </TabPanel>
          <TabPanel class="divide-y divide-gray-200">
            <NotificationsItem
              v-for="notification in archiveNotifications"
              :key="notification.id"
              v-bind="notification"
            />
          </TabPanel>
        </TabPanels>
      </TabGroup> -->

      <SheetFooter />
    </SheetContent>
  </Sheet>
</template>
