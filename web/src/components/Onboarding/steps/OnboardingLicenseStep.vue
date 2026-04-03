<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
} from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';

import OnboardingLoadingState from '~/components/Onboarding/components/OnboardingLoadingState.vue';
import { useActivationCodeDataStore } from '~/components/Onboarding/store/activationCodeData';
import { useServerStore } from '~/store/server';

interface Props {
  onComplete?: () => void;
  onBack?: () => void;
  showBack?: boolean;
  isSavingStep?: boolean;
  activateHref: string;
  activateExternal?: boolean;
  allowSkip?: boolean;
  saveError?: string | null;
}

const props = defineProps<Props>();
const { t, te } = useI18n();
const serverStore = useServerStore();
const { state } = storeToRefs(serverStore);
const { refreshServerState } = serverStore;
const { activationCode, registrationState, hasActivationCode } = storeToRefs(
  useActivationCodeDataStore()
);

// Valid license states where the server is considered "Registered/Licensed"
const VALID_LICENSE_STATES = ['TRIAL', 'BASIC', 'STARTER', 'PLUS', 'PRO', 'UNLEASHED', 'LIFETIME'];
const lt = (key: string, fallback: string) => (te(key) ? t(key) : fallback);

const effectiveState = computed(() => registrationState.value || state.value);

const hasValidLicense = computed(() => {
  return effectiveState.value && VALID_LICENSE_STATES.includes(effectiveState.value);
});

// Computeds
const statusText = computed(() =>
  hasValidLicense.value
    ? lt('onboarding.licenseStep.status.registered', 'Registered')
    : lt('onboarding.licenseStep.status.unregistered', 'Unregistered')
);
const statusBoxTextClass = computed(() => (hasValidLicense.value ? 'text-green-500' : 'text-red-500'));

const activateButtonText = computed(() =>
  hasValidLicense.value
    ? lt('onboarding.licenseStep.actions.manageLicense', 'Manage License')
    : lt('onboarding.licenseStep.actions.activateServer', 'Activate Server')
);

// State
const isCodeRevealed = ref(false);
const isHelpDialogOpen = ref(false);
const isSkipDialogOpen = ref(false);
const isRefreshing = ref(false);
const isBusy = computed(() => Boolean(props.isSavingStep) || isRefreshing.value);
const stepError = computed(() => props.saveError ?? null);

// Methods
const openActivate = () => {
  if (props.activateExternal) {
    const opened = window.open(props.activateHref, '_blank', 'noopener,noreferrer');
    if (opened) {
      opened.opener = null;
    }
  } else {
    window.location.href = props.activateHref;
  }
};

const handleBack = () => {
  props.onBack?.();
};

const toggleCodeReveal = () => {
  isCodeRevealed.value = !isCodeRevealed.value;
};

const refreshStatus = async () => {
  isRefreshing.value = true;
  try {
    await refreshServerState();
  } finally {
    isRefreshing.value = false;
  }
};

const openHelpDialog = () => {
  isHelpDialogOpen.value = true;
};

const closeHelpDialog = () => {
  isHelpDialogOpen.value = false;
};

const handleNext = () => {
  // If registered (should rarely happen if skip logic is consistent), just proceed
  if (hasValidLicense.value) {
    props.onComplete?.();
    return;
  }
  isSkipDialogOpen.value = true;
};

const nextButtonText = computed(() =>
  hasValidLicense.value
    ? lt('onboarding.licenseStep.actions.nextStep', 'NEXT STEP')
    : lt('onboarding.licenseStep.actions.skipForNow', 'Skip for now')
);

const closeSkipDialog = () => {
  isSkipDialogOpen.value = false;
};

const doSkip = () => {
  isSkipDialogOpen.value = false;
  props.onComplete?.();
};
</script>

<template>
  <div class="relative mx-auto w-full max-w-4xl px-4 text-center">
    <OnboardingLoadingState
      v-if="props.isSavingStep"
      :title="t('onboarding.loading.title')"
      :description="t('onboarding.loading.description')"
    />

    <!-- Background Logo Cloud (Similar to Welcome Step) -->

    <!-- Main Card -->
    <!-- Using bg-elevated/bg-card and semantic borders -->
    <div
      v-else
      class="bg-elevated border-muted mx-auto mt-8 max-w-2xl rounded-xl border p-1 shadow-sm md:p-10"
    >
      <div class="flex flex-col items-center gap-6">
        <!-- Icon Box -->
        <div
          class="bg-bg border-muted flex h-20 w-20 items-center justify-center rounded-2xl border shadow-inner"
        >
          <KeyIcon class="text-primary h-8 w-8" />
        </div>

        <!-- Title & Description -->
        <div class="text-center">
          <h2 class="text-highlighted text-xl font-bold tracking-wider uppercase">
            {{ lt('onboarding.licenseStep.title', 'Unraid OS License') }}
          </h2>
          <p class="text-muted mx-auto mt-2 max-w-md text-sm">
            {{
              lt(
                'onboarding.licenseStep.description',
                'Ready for activation. Click below to manage your license and server registration in the Unraid Account App.'
              )
            }}
          </p>
        </div>

        <!-- Info Grid -->
        <div class="mt-4 mb-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          <!-- Status Box -->
          <div
            class="bg-bg border-muted group relative flex flex-col items-start justify-center rounded-lg border p-4"
          >
            <div class="mb-1 flex w-full items-center justify-between">
              <span class="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">{{
                lt('onboarding.licenseStep.labels.status', 'Status')
              }}</span>
              <button
                @click="refreshStatus"
                class="text-muted hover:text-primary -mt-1 -mr-2 p-1 transition-colors focus:outline-none"
                :title="lt('onboarding.licenseStep.actions.refreshStatus', 'Refresh Status')"
                :disabled="isBusy"
              >
                <ArrowPathIcon class="h-3.5 w-3.5" :class="{ 'animate-spin': isRefreshing }" />
              </button>
            </div>
            <span :class="statusBoxTextClass" class="text-sm font-black tracking-wide uppercase">{{
              statusText
            }}</span>
          </div>

          <!-- Activation Code Box -->
          <div
            class="bg-bg border-muted group relative flex flex-col items-start justify-center rounded-lg border p-4"
          >
            <span class="text-muted-foreground mb-1 text-[10px] font-bold tracking-wider uppercase">{{
              lt('onboarding.licenseStep.labels.activationCode', 'Activation Code')
            }}</span>
            <div class="flex w-full items-center gap-2">
              <span class="text-highlighted truncate font-mono text-sm font-bold tracking-wide">
                {{
                  isCodeRevealed
                    ? activationCode?.code || lt('onboarding.licenseStep.labels.none', 'None')
                    : '••••••••••••••••'
                }}
              </span>
              <button
                @click.stop="toggleCodeReveal"
                class="text-muted hover:text-primary ml-auto transition-colors focus:outline-none"
                :disabled="Boolean(props.isSavingStep)"
                :title="
                  isCodeRevealed
                    ? lt('onboarding.licenseStep.actions.hideCode', 'Hide')
                    : lt('onboarding.licenseStep.actions.showCode', 'Show')
                "
              >
                <EyeIcon v-if="!isCodeRevealed" class="h-4 w-4" />
                <EyeSlashIcon v-else class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Activate / Manage Button -->
        <button
          @click="openActivate"
          class="group relative w-full overflow-hidden rounded-lg p-[1px] shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
          :disabled="Boolean(props.isSavingStep)"
          :class="
            hasValidLicense
              ? 'bg-muted border-muted border'
              : 'from-primary bg-gradient-to-r to-orange-600'
          "
        >
          <div
            class="relative flex h-14 w-full items-center justify-center gap-2 rounded-lg transition-all"
            :class="
              hasValidLicense
                ? 'bg-bg text-highlighted group-hover:bg-bg/80'
                : 'from-primary bg-gradient-to-r to-orange-600 text-white group-hover:brightness-110'
            "
          >
            <span class="text-base font-bold tracking-wider uppercase">{{ activateButtonText }}</span>
            <ArrowTopRightOnSquareIcon
              class="h-5 w-5"
              :class="hasValidLicense ? 'text-muted-foreground' : 'text-white/90'"
            />
          </div>
        </button>

        <!-- Help / Support Link -->
        <button
          @click="openHelpDialog"
          class="text-muted hover:text-highlighted mt-4 text-xs font-medium underline underline-offset-2 transition-colors"
          :disabled="Boolean(props.isSavingStep)"
        >
          {{ lt('onboarding.licenseStep.actions.contactSupport', 'Having trouble? Contact Support') }}
        </button>

        <div
          v-if="stepError"
          class="w-full rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10"
        >
          <p class="text-center text-sm font-medium text-red-600 dark:text-red-400">
            {{ stepError }}
          </p>
        </div>

        <!-- Footer / Navigation (Moved Inside Card) -->
        <div
          class="border-muted mt-8 flex w-full flex-col-reverse items-center justify-between gap-4 border-t pt-6 sm:flex-row"
        >
          <button
            v-if="showBack"
            @click="handleBack"
            class="text-muted hover:text-toned group flex w-full items-center justify-center gap-2 font-medium transition-colors sm:w-auto sm:justify-start"
            :disabled="Boolean(props.isSavingStep)"
          >
            <ChevronLeftIcon class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
            {{ t('common.back') }}
          </button>
          <div v-else class="hidden w-1 sm:block" />

          <div class="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            <BrandButton
              :text="nextButtonText"
              class="w-full shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[140px]"
              :variant="hasValidLicense ? 'fill' : 'outline'"
              :class="hasValidLicense ? '!bg-primary hover:!bg-primary/90 !text-white' : '!shadow-none'"
              @click="handleNext"
              :disabled="Boolean(props.isSavingStep) || (!hasValidLicense && !allowSkip)"
              :loading="Boolean(props.isSavingStep)"
              :icon-right="ChevronRightIcon"
            />
          </div>
        </div>
      </div>
    </div>

    <UModal
      :open="isHelpDialogOpen"
      :portal="false"
      :title="lt('onboarding.licenseStep.help.title', 'Contact Support')"
      :ui="{ footer: 'justify-end', overlay: 'z-50', content: 'z-50 max-w-md' }"
      @update:open="isHelpDialogOpen = $event"
    >
      <template #body>
        <div class="text-muted space-y-4 text-sm">
          <p>
            {{
              lt(
                'onboarding.licenseStep.help.contactSupportDescription',
                'If you are experiencing issues with activation, please contact our support team.'
              )
            }}
          </p>
          <p>
            <strong>{{ lt('onboarding.licenseStep.help.supportLabel', 'Support:') }}</strong>
            <a
              href="https://unraid.net/support"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary hover:underline"
              >{{ lt('onboarding.licenseStep.help.supportUrlLabel', 'unraid.net/support') }}</a
            >
          </p>
          <div v-if="hasActivationCode">
            <p class="text-muted-foreground text-xs">
              {{
                lt(
                  'onboarding.licenseStep.help.activationCodeHint',
                  'Please include your Activation Code (copied below) in your email for faster service.'
                )
              }}
            </p>
            <div class="bg-bg border-muted mt-2 flex items-center gap-2 rounded-md border p-2">
              <code class="text-highlighted flex-1 truncate font-mono text-xs">{{
                activationCode?.code
              }}</code>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <UButton color="neutral" variant="outline" @click="closeHelpDialog">
          {{ lt('onboarding.licenseStep.actions.close', 'Close') }}
        </UButton>
      </template>
    </UModal>

    <UModal
      :open="isSkipDialogOpen"
      :portal="false"
      :title="lt('onboarding.licenseStep.skipDialog.title', 'Are you sure?')"
      :ui="{ footer: 'justify-end', overlay: 'z-50', content: 'z-50 max-w-md' }"
      @update:open="isSkipDialogOpen = $event"
    >
      <template #body>
        <div class="text-muted space-y-4 text-sm">
          <UAlert
            v-if="hasActivationCode"
            color="primary"
            variant="solid"
            icon="i-lucide-info"
            :description="
              lt(
                'onboarding.licenseStep.skipDialog.licenseDetected',
                'It appears you already have a license associated with this server. You can activate it now for free to unlock all features.'
              )
            "
          />
          <UAlert color="warning" variant="subtle" icon="i-lucide-triangle-alert">
            <template #description>
              <div class="space-y-2">
                <p>
                  {{
                    lt(
                      'onboarding.licenseStep.skipDialog.warningLine1',
                      'Skipping activation will severely limit system functionality.'
                    )
                  }}
                </p>
                <p>
                  {{
                    lt(
                      'onboarding.licenseStep.skipDialog.warningLine2',
                      'You can always activate your server again later through the Unraid dashboard.'
                    )
                  }}
                </p>
              </div>
            </template>
          </UAlert>
        </div>
      </template>
      <template #footer>
        <UButton color="neutral" variant="outline" @click="closeSkipDialog">
          {{ lt('onboarding.licenseStep.actions.cancel', 'Cancel') }}
        </UButton>
        <UButton color="primary" @click="doSkip">
          {{ lt('onboarding.licenseStep.actions.iUnderstand', 'I Understand') }}
        </UButton>
      </template>
    </UModal>
  </div>
</template>
