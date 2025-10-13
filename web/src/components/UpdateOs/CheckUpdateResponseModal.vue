<script lang="ts" setup>
import { computed, onBeforeMount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import { ArrowDownTrayIcon } from '@heroicons/vue/24/outline';
import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
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
  DialogDescription,
  Label,
  ResponsiveModal,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@unraid/ui';

import type { BrandButtonProps } from '@unraid/ui';

import UpdateOsIgnoredRelease from '~/components/UpdateOs/IgnoredRelease.vue';
import useDateTimeHelper from '~/composables/dateTime';
import { useAccountStore } from '~/store/account';
import { usePurchaseStore } from '~/store/purchase';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';

export interface Props {
  open?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
});
const { t } = useI18n();

const accountStore = useAccountStore();
const purchaseStore = usePurchaseStore();
const serverStore = useServerStore();
const updateOsStore = useUpdateOsStore();

const {
  regExp,
  regUpdatesExpired,
  dateTimeFormat,
  osVersion,
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

  const { outputDateTimeFormatted } = useDateTimeHelper(dateTimeFormat.value, t, true, regExp.value);
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

// Get the localized 'Close' text for comparison
const localizedCloseText = computed(() => t('common.close'));

const notificationsSettings = computed(() => {
  return !updateOsNotificationsEnabled.value
    ? t('updateOs.checkUpdateResponseModal.goToSettingsNotificationsToEnable')
    : undefined;
});

interface ModalCopy {
  title: string;
  description?: string;
}
const modalCopy = computed((): ModalCopy | null => {
  if (checkForUpdatesLoading.value) {
    return {
      title: t('updateOs.checkUpdateResponseModal.checkingForOsUpdates'),
    };
  }

  if (availableWithRenewal.value) {
    const description = regUpdatesExpired.value
      ? `${t('registration.updateExpirationAction.eligibleForUpdatesReleasedOnOr', [formattedRegExp.value])} ${t('registration.updateExpirationAction.extendYourLicenseToAccessThe')}`
      : t('registration.updateExpirationAction.eligibleForFreeFeatureUpdatesUntil', [
          formattedRegExp.value,
        ]);
    return {
      title: t('headerOsVersion.updateAvailable2'),
      description: description,
    };
  } else if (available.value) {
    return {
      title: t('headerOsVersion.updateAvailable2'),
      description: undefined,
    };
  } else if (!available.value && !availableWithRenewal.value) {
    return {
      title: t('updateOs.checkUpdateResponseModal.unraidOsIsUpToDate'),
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
      text: t('updateOs.checkUpdateResponseModal.enableUpdateNotifications'),
    });
  }

  return buttons;
});

const actionButtons = computed((): BrandButtonProps[] => {
  // If ignoring release, show close button as primary action
  if (ignoreThisRelease.value && (available.value || availableWithRenewal.value)) {
    return [
      {
        click: () => close(),
        text: t('common.close'),
      },
    ];
  }

  const buttons: BrandButtonProps[] = [];

  // update not available or no action buttons default to empty array
  if (!available.value && !availableWithRenewal.value) {
    return buttons;
  }

  // update available but not stable branch - should link out to account update callback
  // if availableWithRenewal.value is true, then we need to renew the license before we can update so don't show the verify button
  if (availableRequiresAuth.value && !availableWithRenewal.value) {
    buttons.push({
      click: async () => await accountStore.updateOs(),
      icon: IdentificationIcon,
      text: t('updateOs.checkUpdateResponseModal.verifyToUpdate'),
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
        ? t('updateOs.updateIneligible.viewChangelog')
        : t('updateOs.checkUpdateResponseModal.viewChangelogToStartUpdate'),
    });
  }

  // update available with renewal - open changelog and Extend License options
  if (availableWithRenewal.value) {
    buttons.push({
      click: async () => await purchaseStore.renew(),
      icon: KeyIcon,
      iconRight: ArrowTopRightOnSquareIcon,
      iconRightHoverDisplay: false,
      text: t('updateOs.updateIneligible.extendLicense'),
      title: t('updateOs.updateIneligible.payYourAnnualFeeToContinue'),
    });
  }

  return buttons;
});

const showNoUpdateContent = computed(() => {
  return !checkForUpdatesLoading.value && !available.value && !availableWithRenewal.value;
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
  return (
    !!(
      checkForUpdatesLoading.value ||
      available.value ||
      availableWithRenewal.value ||
      extraLinks.value?.length > 0 ||
      updateOsIgnoredReleases.value.length > 0
    ) || showNoUpdateContent.value
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
    t,
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
  <ResponsiveModal
    :open="open"
    :dialog-class="modalWidth"
    :sheet-class="'h-full'"
    :show-close-button="!checkForUpdatesLoading"
    @update:open="(value) => !value && close()"
  >
    <div class="flex h-full flex-col">
      <ResponsiveModalHeader v-if="modalCopy?.title">
        <ResponsiveModalTitle>
          {{ modalCopy.title }}
        </ResponsiveModalTitle>
        <DialogDescription v-if="modalCopy?.description">
          <span v-html="modalCopy.description" />
        </DialogDescription>
      </ResponsiveModalHeader>

      <div v-if="renderMainSlot" class="flex flex-1 flex-col gap-6 overflow-y-auto px-6">
        <BrandLoading v-if="checkForUpdatesLoading" class="mx-auto w-[150px]" />
        <div v-else class="flex flex-col gap-y-6">
          <!-- OS Update highlight section -->
          <div v-if="available || availableWithRenewal" class="flex flex-col items-center gap-4 py-4">
            <div class="bg-primary/10 flex items-center justify-center rounded-full p-4">
              <ArrowDownTrayIcon class="text-primary h-8 w-8" />
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
                {{ t('updateOs.checkUpdateResponseModal.requiresVerificationToUpdate') }}
              </p>
            </div>
            <div class="mt-4">
              <div
                class="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors"
                @click="ignoreThisRelease = !ignoreThisRelease"
              >
                <Switch v-model="ignoreThisRelease" @click.stop />
                <Label class="text-muted-foreground cursor-pointer text-sm">
                  {{ t('updateOs.checkUpdateResponseModal.ignoreThisReleaseUntilNextReboot') }}
                </Label>
              </div>
            </div>
          </div>

          <div v-if="showNoUpdateContent" class="flex flex-col items-center gap-4 py-6 text-center">
            <div class="bg-primary/10 flex items-center justify-center rounded-full p-4">
              <CheckCircleIcon class="text-primary h-10 w-10" />
            </div>
            <div class="space-y-2">
              <p v-if="osVersion" class="text-muted-foreground text-center text-sm font-semibold">
                {{ t('updateOs.checkUpdateResponseModal.currentVersion', [osVersion]) }}
              </p>
              <p
                v-if="modalCopy?.description"
                class="text-muted-foreground text-xs sm:text-sm"
                v-html="modalCopy.description"
              />
            </div>
          </div>

          <div
            v-if="extraLinks.length > 0"
            :class="cn('xs:!flex-row flex flex-col justify-center gap-2')"
          >
            <BrandButton
              v-for="item in extraLinks"
              :key="item.text"
              :variant="item.variant ?? undefined"
              :href="item.href ?? undefined"
              :icon="item.icon"
              :icon-right="item.iconRight"
              :icon-right-hover-display="item.iconRightHoverDisplay"
              :text="t(item.text ?? '')"
              :title="item.title ? t(item.title) : undefined"
              @click="item.click?.()"
            />
          </div>

          <div
            v-if="updateOsIgnoredReleases.length > 0 && !(available || availableWithRenewal)"
            class="mx-auto flex w-full max-w-[640px] flex-col gap-2"
          >
            <h3 class="text-left text-base font-semibold italic">
              {{ t('updateOs.checkUpdateResponseModal.ignoredReleases') }}
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

      <ResponsiveModalFooter>
        <div
          :class="
            cn(
              'mx-auto flex w-full gap-2',
              actionButtons.length > 0
                ? 'xs:!flex-row flex-col-reverse justify-between'
                : 'justify-center'
            )
          "
        >
          <div :class="cn('xs:!flex-row mt-2 flex flex-col-reverse justify-start gap-3')">
            <TooltipProvider>
              <Tooltip :delay-duration="0">
                <TooltipTrigger as-child>
                  <Button variant="ghost" @click="accountStore.updateOs()">
                    <ArrowTopRightOnSquareIcon class="mr-2 h-4 w-4" />
                    {{ t('updateOs.checkUpdateResponseModal.moreOptions') }}
                  </Button>
                </TooltipTrigger>
                <TooltipContent class="max-w-xs">
                  <div class="flex items-start gap-2">
                    <ArrowTopRightOnSquareIcon
                      class="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0"
                    />
                    <p class="text-left text-sm">
                      {{
                        t('updateOs.checkUpdateResponseModal.manageUpdatePreferencesIncludingBetaAccess')
                      }}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div
            v-if="actionButtons.length > 0"
            :class="cn('xs:!flex-row flex flex-col justify-end gap-3')"
          >
            <template v-for="item in actionButtons" :key="item.text">
              <TooltipProvider v-if="ignoreThisRelease && item.text === localizedCloseText">
                <Tooltip :delay-duration="300">
                  <TooltipTrigger as-child>
                    <BrandButton
                      :variant="item.variant ?? undefined"
                      :icon="item.icon"
                      :icon-right="item.iconRight"
                      :icon-right-hover-display="item.iconRightHoverDisplay"
                      :text="item.text ?? ''"
                      :title="item.title ? item.title : undefined"
                      @click="item.click?.()"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {{ t('updateOs.checkUpdateResponseModal.youCanOptBackInTo') }}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <BrandButton
                v-else
                :variant="item.variant ?? undefined"
                :icon="item.icon"
                :icon-right="item.iconRight"
                :icon-right-hover-display="item.iconRightHoverDisplay"
                :text="item.text ?? ''"
                :title="item.title ? item.title : undefined"
                @click="item.click?.()"
              />
            </template>
          </div>
        </div>
      </ResponsiveModalFooter>
    </div>
  </ResponsiveModal>
</template>
