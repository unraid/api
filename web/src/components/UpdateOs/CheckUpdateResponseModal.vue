<script lang="ts" setup>
import { computed, onBeforeMount, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';

import { ArrowDownTrayIcon } from '@heroicons/vue/24/outline';
import {
  ArrowTopRightOnSquareIcon,
  CogIcon,
  EyeIcon,
  IdentificationIcon,
  KeyIcon,
} from '@heroicons/vue/24/solid';
import {
  BrandButton,
  BrandLoading,
  Button,
  cn,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  Label,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@unraid/ui';

import type { BrandButtonProps } from '@unraid/ui';
import type { ComposerTranslation } from 'vue-i18n';

import UpdateOsIgnoredRelease from '~/components/UpdateOs/IgnoredRelease.vue';
import useDateTimeHelper from '~/composables/dateTime';
import { useAccountStore } from '~/store/account';
import { usePurchaseStore } from '~/store/purchase';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';

export interface Props {
  open?: boolean;
  t: ComposerTranslation;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
});

const accountStore = useAccountStore();
const purchaseStore = usePurchaseStore();
const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();

const {
  regExp,
  regUpdatesExpired,
  dateTimeFormat,
  updateOsIgnoredReleases,
  updateOsNotificationsEnabled,
  updateOsResponse,
} = storeToRefs(serverStore);
const {
  available,
  availableWithRenewal,
  availableReleaseDate,
  availableRequiresAuth,
  checkForUpdatesLoading,
} = storeToRefs(updateOsStore);

/**
 * regExp may not have a value until we get a response from the refreshServerState action
 * So we need to watch for this value to be able to format it based on the user's date time preferences.
 */
const formattedRegExp = ref<string>();
const setFormattedRegExp = () => {
  // ran in watch on regExp and onBeforeMount
  if (!regExp.value) {
    return;
  }

  const { outputDateTimeFormatted } = useDateTimeHelper(
    dateTimeFormat.value,
    props.t,
    true,
    regExp.value
  );
  formattedRegExp.value = outputDateTimeFormatted.value;
};
watch(regExp, (_newV) => {
  setFormattedRegExp();
});

const ignoreThisRelease = ref(false);
// if we had a release ignored and now we don't set ignoreThisRelease to false
watch(updateOsIgnoredReleases, (newVal, oldVal) => {
  if (oldVal.length > 0 && newVal.length === 0) {
    ignoreThisRelease.value = false;
  }
});

const notificationsSettings = computed(() => {
  return !updateOsNotificationsEnabled.value
    ? props.t(
        'Go to Settings > Notifications to enable automatic OS update notifications for future releases.'
      )
    : undefined;
});

interface ModalCopy {
  title: string;
  description?: string;
}
const modalCopy = computed((): ModalCopy | null => {
  if (checkForUpdatesLoading.value) {
    return {
      title: props.t('Checking for OS updates...'),
    };
  }

  // Use the release date
  let formattedReleaseDate = '';
  if (availableReleaseDate.value) {
    // build string with prefix
    formattedReleaseDate = props.t('Release date {0}', [userFormattedReleaseDate.value]);
  }

  if (availableWithRenewal.value) {
    const description = regUpdatesExpired.value
      ? `${props.t('Eligible for updates released on or before {0}.', [formattedRegExp.value])} ${props.t('Extend your license to access the latest updates.')}`
      : props.t('Eligible for free feature updates until {0}', [formattedRegExp.value]);
    return {
      title: props.t('Update Available'),
      description: description,
    };
  } else if (available.value) {
    return {
      title: props.t('Update Available'),
      description: undefined,
    };
  } else if (!available.value && !availableWithRenewal.value) {
    return {
      title: props.t('Unraid OS is up-to-date'),
      description: notificationsSettings.value ?? undefined,
    };
  }
  return null;
});

const showNotificationsSettingsLink = computed(() => {
  return !updateOsNotificationsEnabled.value && !available.value && !availableWithRenewal.value;
});

const extraLinks = computed((): BrandButtonProps[] => {
  const buttons: BrandButtonProps[] = [];

  if (showNotificationsSettingsLink.value) {
    buttons.push({
      variant: 'outline',
      href: '/Settings/Notifications',
      icon: CogIcon,
      text: props.t('Enable update notifications'),
    });
  }

  return buttons;
});

const actionButtons = computed((): BrandButtonProps[] | null => {
  // If ignoring release, show close button as primary action
  if (ignoreThisRelease.value && (available.value || availableWithRenewal.value)) {
    return [
      {
        click: () => close(),
        text: props.t('Close'),
      },
    ];
  }

  // update not available or no action buttons default closing
  if (!available.value) {
    return null;
  }

  const buttons: BrandButtonProps[] = [];

  // update available but not stable branch - should link out to account update callback
  // if availableWithRenewal.value is true, then we need to renew the license before we can update so don't show the verify button
  if (availableRequiresAuth.value && !availableWithRenewal.value) {
    buttons.push({
      click: async () => await accountStore.updateOs(),
      icon: IdentificationIcon,
      text: props.t('Verify to Update'),
    });

    return buttons;
  }

  // update available - open changelog to commence update
  if (available.value && updateOsResponse.value?.changelog) {
    buttons.push({
      variant: availableWithRenewal.value ? 'outline' : undefined,
      click: async () => await updateOsStore.setReleaseForUpdate(updateOsResponse.value ?? null),
      icon: EyeIcon,
      text: availableWithRenewal.value
        ? props.t('View Changelog')
        : props.t('View Changelog to Start Update'),
    });
  }

  // update available with renewal - open changelog and Extend License options
  if (availableWithRenewal.value) {
    buttons.push({
      click: async () => await purchaseStore.renew(),
      icon: KeyIcon,
      iconRight: ArrowTopRightOnSquareIcon,
      iconRightHoverDisplay: false,
      text: props.t('Extend License'),
      title: props.t('Pay your annual fee to continue receiving OS updates.'),
    });
  }

  return buttons;
});

const close = () => {
  // close it
  updateOsStore.setModalOpen(false);
  // then ignore the release if applicable
  if (ignoreThisRelease.value && (availableWithRenewal.value || available.value)) {
    setTimeout(() => {
      serverStore.updateOsIgnoreRelease(availableWithRenewal.value ?? available.value ?? '');
    }, 500);
  }
};

const renderMainSlot = computed(() => {
  return !!(
    checkForUpdatesLoading.value ||
    available.value ||
    availableWithRenewal.value ||
    extraLinks.value?.length > 0 ||
    updateOsIgnoredReleases.value.length > 0
  );
});

const userFormattedReleaseDate = ref<string>();
/**
 * availableReleaseDate may not have a value until we get a release in the update os check response.
 * So we need to watch for this value to be able to format it based on the user's date time preferences.
 */
const setUserFormattedReleaseDate = () => {
  if (!availableReleaseDate.value) {
    return;
  }

  const { outputDateTimeFormatted } = useDateTimeHelper(
    dateTimeFormat.value,
    props.t,
    true,
    availableReleaseDate.value.valueOf()
  );
  userFormattedReleaseDate.value = outputDateTimeFormatted.value;
};
watch(availableReleaseDate, (_newV) => {
  setUserFormattedReleaseDate();
});
onBeforeMount(() => {
  if (availableReleaseDate.value) {
    setUserFormattedReleaseDate();
  }
  setFormattedRegExp();
});

const modalWidth = computed(() => {
  if (availableWithRenewal.value) {
    // wider since we'll have four buttons
    return 'max-w-[800px]';
  }
  return 'max-w-[640px]';
});
</script>

<template>
  <DialogRoot :open="open" @update:open="(value) => !value && close()">
    <DialogContent :class="modalWidth" :show-close-button="!checkForUpdatesLoading">
      <DialogHeader v-if="modalCopy?.title">
        <DialogTitle>
          {{ modalCopy.title }}
        </DialogTitle>
        <DialogDescription v-if="modalCopy?.description">
          <span v-html="modalCopy.description" />
        </DialogDescription>
      </DialogHeader>

      <div v-if="renderMainSlot" class="flex flex-col gap-6">
        <BrandLoading v-if="checkForUpdatesLoading" class="mx-auto w-[150px]" />
        <div v-else class="flex flex-col gap-y-6">
          <!-- OS Update highlight section -->
          <div v-if="available || availableWithRenewal" class="flex flex-col items-center gap-4 py-4">
            <div class="bg-primary/10 flex items-center justify-center rounded-full p-4">
              <ArrowDownTrayIcon class="text-primary h-12 w-12" />
            </div>
            <div class="text-center">
              <h2 class="text-foreground text-3xl font-bold">
                {{ availableWithRenewal || available }}
              </h2>
              <p v-if="userFormattedReleaseDate" class="text-muted-foreground mt-2 text-center text-sm">
                Released on {{ userFormattedReleaseDate }}
              </p>
              <p
                v-if="availableRequiresAuth && !availableWithRenewal"
                class="mt-2 text-center text-sm text-amber-500"
              >
                {{ t('Requires verification to update') }}
              </p>
            </div>
          </div>

          <div
            v-if="extraLinks.length > 0"
            :class="cn('xs:!flex-row flex flex-col justify-center gap-2')"
          >
            <BrandButton
              v-for="item in extraLinks"
              :key="item.text"
              :btn-style="item.variant ?? undefined"
              :href="item.href ?? undefined"
              :icon="item.icon"
              :icon-right="item.iconRight"
              :icon-right-hover-display="item.iconRightHoverDisplay"
              :text="t(item.text ?? '')"
              :title="item.title ? t(item.title) : undefined"
              @click="item.click?.()"
            />
          </div>

          <div v-if="available || availableWithRenewal" class="border-t pt-4">
            <div
              class="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors"
              @click="ignoreThisRelease = !ignoreThisRelease"
            >
              <Switch v-model="ignoreThisRelease" @click.stop />
              <Label class="text-muted-foreground cursor-pointer text-sm">
                {{ t('Ignore this release until next reboot') }}
              </Label>
            </div>
          </div>
          <div
            v-else-if="updateOsIgnoredReleases.length > 0"
            class="mx-auto flex w-full max-w-[640px] flex-col gap-2"
          >
            <h3 class="text-left text-base font-semibold italic">
              {{ t('Ignored Releases') }}
            </h3>
            <UpdateOsIgnoredRelease
              v-for="ignoredRelease in updateOsIgnoredReleases"
              :key="ignoredRelease"
              :label="ignoredRelease"
              :t="t"
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <div
          :class="
            cn(
              'mx-auto flex w-full gap-2',
              actionButtons ? 'xs:!flex-row flex-col-reverse justify-between' : 'justify-center'
            )
          "
        >
          <div :class="cn('xs:!flex-row flex flex-col-reverse justify-start gap-2')">
            <Button variant="ghost" @click="accountStore.updateOs()">
              <ArrowTopRightOnSquareIcon class="mr-2 h-4 w-4" />
              {{ t('Select Version or Opt Into Beta') }}
            </Button>
          </div>
          <div v-if="actionButtons" :class="cn('xs:!flex-row flex flex-col justify-end gap-2')">
            <template v-for="item in actionButtons" :key="item.text">
              <TooltipProvider v-if="ignoreThisRelease && item.text === 'Close'">
                <Tooltip :delay-duration="300">
                  <TooltipTrigger as-child>
                    <BrandButton
                      :btn-style="item.variant ?? undefined"
                      :icon="item.icon"
                      :icon-right="item.iconRight"
                      :icon-right-hover-display="item.iconRightHoverDisplay"
                      :text="t(item.text ?? '')"
                      :title="item.title ? t(item.title) : undefined"
                      @click="item.click?.()"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {{
                        t(
                          'You can opt back in to an ignored release by clicking on the Check for Updates button in the header anytime'
                        )
                      }}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <BrandButton
                v-else
                :btn-style="item.variant ?? undefined"
                :icon="item.icon"
                :icon-right="item.iconRight"
                :icon-right-hover-display="item.iconRightHoverDisplay"
                :text="t(item.text ?? '')"
                :title="item.title ? t(item.title) : undefined"
                @click="item.click?.()"
              />
            </template>
          </div>
        </div>
      </DialogFooter>
    </DialogContent>
  </DialogRoot>
</template>
