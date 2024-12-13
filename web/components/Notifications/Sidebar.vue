<script setup lang="ts">
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/shadcn/sheet';
import { Button } from '@/components/shadcn/button';
import { useMutation } from '@vue/apollo-composable';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- false positive :(
import { Importance, NotificationType } from '~/composables/gql/graphql';
import { archiveAllNotifications, deleteAllNotifications } from './graphql/notification.query';

const { mutate: archiveAll, loading: loadingArchiveAll } = useMutation(archiveAllNotifications);
const { mutate: deleteAll, loading: loadingDeleteAll } = useMutation(deleteAllNotifications);
const { teleportTarget, determineTeleportTarget } = useTeleport();
const importance = ref<Importance | undefined>(undefined);

const confirmAndArchiveAll = async () => {
  if (confirm('This will archive all notifications on your Unraid server. Continue?')) {
    await archiveAll();
  }
};

const confirmAndDeleteAll = async () => {
  if (
    confirm('This will permanently delete all notifications currently on your Unraid server. Continue?')
  ) {
    await deleteAll();
  }
};
</script>

<template>
  <Sheet>
    <SheetTrigger @click="determineTeleportTarget">
      <span class="sr-only">Notifications</span>
      <NotificationsIndicator />
    </SheetTrigger>

    <!-- We remove the horizontal padding from the container to keep the NotificationList's scrollbar in the right place -->
    <SheetContent
      :to="teleportTarget"
      class="w-full max-w-[100vw] sm:max-w-[540px] h-screen px-0"
    >
      <div class="flex flex-col h-full gap-5">
        <SheetHeader class="ml-1 px-6 flex items-baseline gap-1">
          <SheetTitle class="text-2xl">Notifications</SheetTitle>
          <a href="/Settings/Notifications">
            <Button variant="link" size="sm" class="p-0 h-auto"> Edit Settings </Button>
          </a>
        </SheetHeader>

        <!-- min-h-0 prevents the flex container from expanding beyond its containing bounds. -->
        <!-- this is necessary because flex items have a default min-height: auto, -->
        <!-- which means they won't shrink below the height of their content, even if you use flex-1 or other flex properties. -->
        <Tabs default-value="unread" class="flex-1 flex flex-col min-h-0" activation-mode="manual">
          <div class="flex flex-row justify-between items-center flex-wrap gap-5 px-6">
            <TabsList class="ml-[1px]">
              <TabsTrigger value="unread"> Unread </TabsTrigger>
              <TabsTrigger value="archived"> Archived </TabsTrigger>
            </TabsList>
            <TabsContent value="unread">
              <Button
                :disabled="loadingArchiveAll"
                variant="link"
                size="sm"
                class="text-foreground hover:text-destructive transition-none"
                @click="confirmAndArchiveAll"
              >
                Archive All
              </Button>
            </TabsContent>
            <TabsContent value="archived">
              <Button
                :disabled="loadingDeleteAll"
                variant="link"
                size="sm"
                class="text-foreground hover:text-destructive transition-none"
                @click="confirmAndDeleteAll"
              >
                Delete All
              </Button>
            </TabsContent>

            <Select
              @update:model-value="
                (val) => {
                  importance = val === 'all' ? undefined : (val as Importance);
                }
              "
            >
              <SelectTrigger class="h-auto">
                <SelectValue class="text-gray-400 leading-6" placeholder="Filter By" />
              </SelectTrigger>
              <SelectContent :to="teleportTarget">
                <SelectGroup>
                  <SelectLabel>Notification Types</SelectLabel>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem :value="Importance.Alert"> Alert </SelectItem>
                  <SelectItem :value="Importance.Info">Info</SelectItem>
                  <SelectItem :value="Importance.Warning">Warning</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="unread" class="flex-1 min-h-0 mt-5">
            <NotificationsList :importance="importance" :type="NotificationType.Unread" />
          </TabsContent>

          <TabsContent value="archived" class="flex-1 min-h-0 mt-5">
            <NotificationsList :importance="importance" :type="NotificationType.Archive" />
          </TabsContent>
        </Tabs>
      </div>
    </SheetContent>
  </Sheet>
</template>
