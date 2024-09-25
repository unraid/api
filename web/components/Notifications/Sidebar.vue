<script setup lang="ts">
import { BellIcon } from '@heroicons/vue/24/solid';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/shadcn/sheet';
import type { NotificationItemProps } from '~/types/ui/notification';

const unreadNotifications: NotificationItemProps[] = [
  {
    id: '1',
    subject: 'New User Registration',
    message: 'A new user has registered on your platform.',
    type: 'success',
  },
  {
    id: '2',
    subject: 'Drive Pre-Failure Detected',
    message: 'Drive 1 has been detected as pre-failure.',
    type: 'alert',
  },
  {
    id: '3',
    subject: 'Server Maintenance',
    message: 'Your server will be undergoing maintenance at 12:00 AM.',
    type: 'warning',
  },
];

const archiveNotifications: NotificationItemProps[] = [
  {
    id: '1',
    subject: 'Archived New User Registration',
    message: 'A new user has registered on your platform.',
    type: 'success',
  },
  {
    id: '2',
    subject: 'Archived Drive Pre-Failure Detected',
    message: 'Drive 1 has been detected as pre-failure.',
    type: 'alert',
  },
  {
    id: '3',
    subject: 'Archived Server Maintenance',
    message: 'Your server will be undergoing maintenance at 12:00 AM.',
    type: 'warning',
  },
];
</script>

<template>
  <Sheet>
    <SheetTrigger>
      <span class="sr-only">Notifications</span>
      <BellIcon class="w-6 h-6" />
    </SheetTrigger>

    <SheetContent class="w-full max-w-[400px] sm:max-w-[540px]">
      <SheetHeader>
        <SheetTitle>Notifications</SheetTitle>

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
        </Tabs>
      </SheetHeader>
    </SheetContent>
  </Sheet>
</template>