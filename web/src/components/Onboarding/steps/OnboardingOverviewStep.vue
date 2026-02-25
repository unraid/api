<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useMutation } from '@vue/apollo-composable';

import { ChevronRightIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';
import limitlessImage from '@/assets/limitless_possibilities.jpg';
import { COMPLETE_ONBOARDING_MUTATION } from '@/components/Onboarding/graphql/completeUpgradeStep.mutation';
import { useActivationCodeDataStore } from '@/components/Onboarding/store/activationCodeData';
import { cleanupOnboardingStorage } from '@/components/Onboarding/store/onboardingStorageCleanup';
import { useUpgradeOnboardingStore } from '@/components/Onboarding/store/upgradeOnboarding';
import { useThemeStore } from '@/store/theme';

// Mock icons (assuming these exist or similar ones do)
const BOOK_ICON = 'i-heroicons-book-open';
const CLOCK_ICON = 'i-heroicons-clock';
const WELCOME_ICON = 'i-heroicons-server-stack';

export interface Props {
  // Common props
  onComplete: () => void;
  onSkipSetup?: () => void;
  onBack?: () => void;
  showBack?: boolean;
  isSavingStep?: boolean;
}

const props = defineProps<Props>();
const { t } = useI18n();

const { mutate: completeOnboarding } = useMutation(COMPLETE_ONBOARDING_MUTATION);
const { refetchOnboarding } = useUpgradeOnboardingStore();
const { partnerInfo, isFreshInstall } = storeToRefs(useActivationCodeDataStore());
const { isUpgrade, isDowngrade, isIncomplete } = storeToRefs(useUpgradeOnboardingStore());
const { theme } = storeToRefs(useThemeStore());

const isSkipping = ref(false);
const partnerGraphicLoadFailed = ref(false);

const isBusy = computed(() => props.isSavingStep || isSkipping.value);

const isPartnerLogo = computed(
  () =>
    partnerInfo.value?.branding?.hasPartnerLogo &&
    (partnerInfo.value?.branding?.partnerLogoLightUrl || partnerInfo.value?.branding?.partnerLogoDarkUrl)
);

const isDarkTheme = computed(() => ['black', 'gray'].includes(theme.value.name));

const partnerGraphicSrc = computed(() => {
  const branding = partnerInfo.value?.branding;
  if (!branding) return null;

  if (isDarkTheme.value) {
    return branding.partnerLogoDarkUrl || branding.partnerLogoLightUrl || null;
  }

  return branding.partnerLogoLightUrl || branding.partnerLogoDarkUrl || null;
});

watch(partnerGraphicSrc, () => {
  partnerGraphicLoadFailed.value = false;
});

const handlePartnerGraphicError = () => {
  if (isPartnerLogo.value) {
    partnerGraphicLoadFailed.value = true;
  }
};

const graphicSrc = computed(() =>
  isPartnerLogo.value && !partnerGraphicLoadFailed.value
    ? partnerGraphicSrc.value || limitlessImage
    : limitlessImage
);

const graphicAlt = computed(() =>
  isPartnerLogo.value && !partnerGraphicLoadFailed.value
    ? (partnerInfo.value?.partner?.name ?? 'Partner Logo')
    : 'Limitless Possibilities'
);

const defaultWelcomeTitle = computed(() => {
  if (isFreshInstall.value) {
    return t('onboarding.overviewStep.titleFreshInstall');
  }

  if (isUpgrade.value) {
    return t('onboarding.overviewStep.titleUpgrade');
  }

  if (isDowngrade.value) {
    return t('onboarding.overviewStep.titleDowngrade');
  }

  if (isIncomplete.value) {
    return t('onboarding.overviewStep.titleIncomplete');
  }

  return t('onboarding.overviewStep.title');
});

const defaultWelcomeSubtitle = computed(() => {
  if (isFreshInstall.value) {
    return t('onboarding.overviewStep.subtitleFreshInstall');
  }

  if (isUpgrade.value) {
    return t('onboarding.overviewStep.subtitleUpgrade');
  }

  if (isDowngrade.value) {
    return t('onboarding.overviewStep.subtitleDowngrade');
  }

  if (isIncomplete.value) {
    return t('onboarding.overviewStep.subtitleIncomplete');
  }

  return t('onboarding.overviewStep.subtitle');
});

const welcomeTitle = computed(() => {
  const branding = partnerInfo.value?.branding;
  if (!branding) {
    return defaultWelcomeTitle.value;
  }

  if (isFreshInstall.value) {
    return branding.onboardingTitleFreshInstall || branding.onboardingTitle || defaultWelcomeTitle.value;
  }

  if (isUpgrade.value) {
    return branding.onboardingTitleUpgrade || branding.onboardingTitle || defaultWelcomeTitle.value;
  }

  if (isDowngrade.value) {
    return branding.onboardingTitleDowngrade || branding.onboardingTitle || defaultWelcomeTitle.value;
  }

  if (isIncomplete.value) {
    return branding.onboardingTitleIncomplete || branding.onboardingTitle || defaultWelcomeTitle.value;
  }

  return branding.onboardingTitle || defaultWelcomeTitle.value;
});

const welcomeSubtitle = computed(() => {
  const branding = partnerInfo.value?.branding;
  if (!branding) {
    return defaultWelcomeSubtitle.value;
  }

  if (isFreshInstall.value) {
    return (
      branding.onboardingSubtitleFreshInstall ||
      branding.onboardingSubtitle ||
      defaultWelcomeSubtitle.value
    );
  }

  if (isUpgrade.value) {
    return (
      branding.onboardingSubtitleUpgrade || branding.onboardingSubtitle || defaultWelcomeSubtitle.value
    );
  }

  if (isDowngrade.value) {
    return (
      branding.onboardingSubtitleDowngrade || branding.onboardingSubtitle || defaultWelcomeSubtitle.value
    );
  }

  if (isIncomplete.value) {
    return (
      branding.onboardingSubtitleIncomplete ||
      branding.onboardingSubtitle ||
      defaultWelcomeSubtitle.value
    );
  }

  return branding.onboardingSubtitle || defaultWelcomeSubtitle.value;
});

const handleComplete = () => {
  props.onComplete();
};

const handleSkipOnboarding = async () => {
  if (props.onSkipSetup) {
    props.onSkipSetup();
    return;
  }

  isSkipping.value = true;
  try {
    await completeOnboarding();
    await new Promise((r) => setTimeout(r, 500));
    await refetchOnboarding();
    cleanupOnboardingStorage({ clearTemporaryBypassSessionState: true });
    window.location.reload();
  } catch (e) {
    console.error(e);
    isSkipping.value = false;
  }
};

const openDocs = () => {
  window.open('https://docs.unraid.net/unraid-os/getting-started/', '_blank', 'noreferrer');
};
</script>

<template>
  <div class="relative mx-auto w-full max-w-4xl px-4 pb-4 md:px-8">
    <!-- Main Card Container -->
    <div class="bg-elevated border-muted rounded-xl border p-6 shadow-sm md:p-10">
      <!-- Header Row (Title, Subtitle, and Badge) -->
      <div class="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <UIcon :name="WELCOME_ICON" class="text-primary h-8 w-8" />
            <h1 class="text-highlighted text-3xl font-extrabold tracking-tight uppercase">
              {{ welcomeTitle }}
            </h1>
          </div>
          <p class="text-muted text-lg">
            {{ welcomeSubtitle }}
          </p>
        </div>

        <!-- Setup Time Badge -->
        <div
          class="bg-primary/10 text-primary border-primary/20 inline-flex items-center gap-2 self-start rounded-full border px-4 py-2 whitespace-nowrap"
        >
          <UIcon :name="CLOCK_ICON" class="h-5 w-5" />
          <span class="text-sm font-bold tracking-wide">{{
            t('onboarding.overviewStep.setupTime')
          }}</span>
        </div>
      </div>

      <!-- Introduction (Full Width) -->
      <div class="border-primary/40 mb-10 border-l-4 pl-4">
        <p class="text-muted max-w-full text-base italic">
          {{ t('onboarding.overviewStep.intro') }}
        </p>
      </div>

      <!-- Main Content Grid (Image on left, Help on right) -->
      <div class="mb-8 grid grid-cols-1 gap-10 text-left md:grid-cols-2">
        <!-- Left Column: Graphic -->
        <div class="flex h-full flex-col justify-center">
          <div class="relative aspect-video w-full overflow-hidden rounded-xl shadow-sm">
            <img
              :src="graphicSrc"
              :alt="graphicAlt"
              class="h-full w-full object-cover transition-all duration-300"
              @error="handlePartnerGraphicError"
            />
          </div>
        </div>

        <!-- Right Column: Actions (Help Section) -->
        <div class="flex h-full flex-col">
          <!-- Help Section -->
          <div class="border-muted bg-bg/50 flex h-full flex-col rounded-xl border p-6">
            <div class="mb-4 flex items-center gap-3">
              <UIcon :name="BOOK_ICON" class="text-primary h-6 w-6" />
              <h3 class="text-primary text-sm font-bold tracking-wider uppercase">
                {{ t('onboarding.overviewStep.needHelp.title') }}
              </h3>
            </div>

            <p class="text-muted mb-6 flex-grow">
              {{ t('onboarding.overviewStep.needHelp.description') }}
            </p>

            <button
              @click="openDocs"
              class="border-muted hover:border-toned hover:bg-muted text-toned flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 font-medium transition-all"
            >
              {{ t('onboarding.overviewStep.needHelp.button') }}
              <UIcon name="i-heroicons-arrow-top-right-on-square" class="ml-1 h-4 w-4 opacity-70" />
            </button>
          </div>
        </div>
      </div>

      <!-- Disclaimer Box (Full Width) -->
      <!-- <div class="p-5 rounded-xl bg-accented border border-muted/50 mb-8">
        <p class="text-muted italic text-sm leading-relaxed text-center">
          {{ t('onboarding.overviewStep.disclaimer') }}
        </p>
      </div> -->

      <!-- Footer Actions -->
      <div class="border-muted flex items-center justify-between border-t pt-6">
        <button
          v-if="showBack"
          @click="onBack"
          class="text-muted hover:text-toned group flex items-center gap-2 font-medium transition-colors"
          :disabled="isBusy"
        >
          <UIcon
            name="i-heroicons-chevron-left"
            class="h-5 w-5 transition-transform group-hover:-translate-x-0.5"
          />
          {{ t('common.back') }}
        </button>
        <div v-else class="w-1" />

        <div class="flex items-center gap-6">
          <button
            @click="handleSkipOnboarding"
            class="text-muted hover:text-toned text-sm font-medium transition-colors"
            :disabled="isBusy"
          >
            Skip Setup
          </button>

          <BrandButton
            :text="t('onboarding.overviewStep.nextStep')"
            class="!bg-primary hover:!bg-primary/90 min-w-[160px] !text-white shadow-md transition-all hover:shadow-lg"
            :disabled="isBusy"
            :loading="isBusy"
            @click="handleComplete"
            :icon-right="ChevronRightIcon"
          />
        </div>
      </div>
    </div>
  </div>
</template>
