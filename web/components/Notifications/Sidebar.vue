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

import { archiveAllNotifications } from "./graphql/notification.query";
import { NotificationType } from "~/composables/gql/graphql";
import { useMutation } from "@vue/apollo-composable";

const { mutate: archiveAll, loading: loadingArchiveAll } = useMutation(
  archiveAllNotifications
);
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
      class="w-full sm:max-w-[540px] space-y-3 h-screen"
    >
      <SheetHeader>
        <SheetTitle>Notifications</SheetTitle>
      </SheetHeader>

      <Tabs default-value="unread" class="h-full">
        <div class="flex flex-row justify-between items-center flex-wrap gap-2">
          <TabsList class="ml-[1px]">
            <TabsTrigger value="unread"> Unread </TabsTrigger>
            <TabsTrigger value="archived"> Archived </TabsTrigger>
          </TabsList>

          <Button
            :disabled="loadingArchiveAll"
            variant="link"
            size="sm"
            class="text-muted-foreground text-base p-0"
            @click="archiveAll"
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

        <TabsContent value="unread" class="h-[92%]">
          <NotificationsList :type="NotificationType.Unread" />
        </TabsContent>

        <TabsContent value="archived">
          <NotificationsList :type="NotificationType.Archive" />
        </TabsContent>
      </Tabs>

    </SheetContent>
  </Sheet>
</template>
