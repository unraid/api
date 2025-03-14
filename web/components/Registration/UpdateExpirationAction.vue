<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, h } from "vue";

import { ArrowPathIcon, ArrowTopRightOnSquareIcon } from "@heroicons/vue/24/solid";
import { BrandButton, BrandLoading } from "@unraid/ui";

import { DOCS_REGISTRATION_LICENSING } from "~/helpers/urls";

import type { ComposerTranslation } from "vue-i18n";

import useDateTimeHelper from "~/composables/dateTime";
import { useReplaceRenewStore } from "~/store/replaceRenew";
import { useServerStore } from "~/store/server";

export interface Props {
  t: ComposerTranslation;
}

const props = defineProps<Props>();

const replaceRenewStore = useReplaceRenewStore();
const serverStore = useServerStore();

const { renewStatus, validationResponseTimestamp } = storeToRefs(replaceRenewStore);
const { dateTimeFormat, regExp, regUpdatesExpired, renewAction } = storeToRefs(
  serverStore
);

const reload = () => {
  window.location.reload();
};

const {
  outputDateTimeReadableDiff: readableDiffRegExp,
  outputDateTimeFormatted: formattedRegExp,
} = useDateTimeHelper(dateTimeFormat.value, props.t, true, regExp.value);

const {
  outputDateTimeReadableDiff: readableDiffValidationResponseTimestamp,
  outputDateTimeFormatted: formattedValidationResponseTimestamp,
} = useDateTimeHelper(
  dateTimeFormat.value,
  props.t,
  false,
  validationResponseTimestamp.value ?? undefined
);

const output = computed(() => {
  if (!regExp.value) {
    return undefined;
  }
  return {
    text: regUpdatesExpired.value
      ? props.t("Ineligible for feature updates released after {0}", [
          formattedRegExp.value,
        ])
      : props.t("Eligible for free feature updates until {0}", [formattedRegExp.value]),
    title: regUpdatesExpired.value
      ? props.t("Ineligible as of {0}", [readableDiffRegExp.value])
      : props.t("Eligible for free feature updates for {0}", [readableDiffRegExp.value]),
  };
});

const showCheckTimestamp = computed(() => {
  return (
    validationResponseTimestamp.value && validationResponseTimestamp.value > regExp.value
  );
});

const reloadPage = () => {
  window.location.reload();
};

const BrandLoadingIcon = () => h(BrandLoading, { size: 'sm' });

const statusContent = computed(() => {
  switch (renewStatus.value) {
    case "installed":
      return {
        text: props.t(
          "Your license key was automatically renewed and installed. Reload the page to see updated details."
        ),
        action: {
          icon: ArrowPathIcon,
          title: "Reload Page",
          onClick: reloadPage,
        },
      };
    case "checking":
      return {
        component: BrandLoadingIcon,
        text: props.t("Checking for extended license..."),
      };
    case "error":
      return { text: props.t("Error checking for extended license.") };
    case "ready":
      return {
        text: showCheckTimestamp.value ? `Last checked: ${formattedValidationResponseTimestamp.value}` : null,
        action: {
          icon: ArrowPathIcon,
          title: "Check Again for Extended License",
          onClick: () => replaceRenewStore.check(true), // consider debouncing this
        },
      };
    default:
      return null;
  }
});
</script>

<template>
  <div v-if="output" class="flex flex-col gap-8px">
    <RegistrationUpdateExpiration :t="t" />

    <div class="flex flex-wrap items-center justify-between gap-8px">
      <BrandButton
        v-if="renewStatus === 'installed'"
        :icon="ArrowPathIcon"
        :text="t('Reload Page')"
        class="flex-grow"
        @click="reload"
      />
      <BrandButton
        v-else-if="regUpdatesExpired"
        :disabled="renewAction?.disabled"
        :external="renewAction?.external"
        :icon="renewAction.icon"
        :icon-right="ArrowTopRightOnSquareIcon"
        :icon-right-hover-display="true"
        :text="t('Extend License')"
        :title="t('Pay your annual fee to continue receiving OS updates.')"
        class="flex-grow"
        @click="renewAction.click?.()"
      />

      <BrandButton
        variant="underline"
        :external="true"
        :href="DOCS_REGISTRATION_LICENSING.toString()"
        :icon-right="ArrowTopRightOnSquareIcon"
        :text="t('Learn More')"
        class="text-14px"
      />

      <p class="text-14px opacity-90 w-full flex flex-wrap gap-8px items-center">
        <template v-if="statusContent">
          <BrandButton
            v-if="statusContent.action"
            variant="underline"
            :icon="statusContent.action.icon"
            :title="statusContent.action.title"
            size="12px"
            @click="statusContent.action.onClick"
          />
          <component :is="statusContent.component" v-if="statusContent.component" />
          <span v-if="statusContent.text">{{ statusContent.text }}</span>
        </template>
      </p>
    </div>
  </div>
</template>
