<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  BookOpenIcon,
  ChatBubbleBottomCenterTextIcon,
  ChevronLeftIcon,
  ClipboardDocumentListIcon,
  LinkIcon,
  RocketLaunchIcon,
  ServerIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/vue/24/outline';
import { CheckCircleIcon, EnvelopeIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';
// Use ?raw to import SVG content string
import UnraidIconSvg from '@/assets/partners/simple-icons-unraid.svg?raw';
import { useActivationCodeDataStore } from '@/components/Onboarding/store/activationCodeData';

export interface Props {
  onComplete: () => void;
  onBack?: () => void;
  showBack?: boolean;
}

const props = defineProps<Props>();
const { t } = useI18n();
const store = useActivationCodeDataStore();

const partnerInfo = computed(() => store.partnerInfo);
const activationCode = computed(() => store.activationCode);

// Check if we have any core documentation links
const hasCoreDocsLinks = computed(
  () =>
    !!partnerInfo.value?.partner?.manualUrl ||
    !!partnerInfo.value?.partner?.hardwareSpecsUrl ||
    !!partnerInfo.value?.partner?.supportUrl
);

// Check if we have any extra links
const hasExtraLinks = computed(() => (partnerInfo.value?.partner?.extraLinks?.length ?? 0) > 0);

// Check if we have any content to show in the "Learn about your server" section
// Only show if there are LINKS (docs or extra links) - system specs alone isn't enough
const hasAnyPartnerContent = computed(() => hasCoreDocsLinks.value || hasExtraLinks.value);

const basicsItems = [
  { label: t('onboarding.nextSteps.basics.shares'), url: 'https://docs.unraid.net/go/shares/' },
  { label: t('onboarding.nextSteps.basics.arrays'), url: 'https://docs.unraid.net/go/parity/' },
  {
    label: t('onboarding.nextSteps.basics.cachePools'),
    url: 'https://docs.unraid.net/go/adding-pools/',
  },
  {
    label: t('onboarding.nextSteps.basics.installingApps'),
    url: 'https://docs.unraid.net/unraid-os/manual/applications/',
  },
  { label: t('onboarding.nextSteps.basics.remoteAccess'), url: 'https://docs.unraid.net/go/tailscale/' },
  {
    label: t('onboarding.nextSteps.basics.commonIssues'),
    url: 'https://docs.unraid.net/category/common-issues/',
  },
];

const handleMouseMove = (e: MouseEvent) => {
  const el = e.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  el.style.setProperty('--x', `${x}px`);
  el.style.setProperty('--y', `${y}px`);
};
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4 pb-4 md:px-8">
    <div class="bg-elevated border-muted rounded-xl border p-6 text-left shadow-sm md:p-10">
      <!-- Header -->
      <div class="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <RocketLaunchIcon class="text-primary h-8 w-8" />
            <h2 class="text-highlighted text-3xl font-extrabold tracking-tight uppercase">
              {{ t('onboarding.nextSteps.title') }}
            </h2>
          </div>
          <p class="text-muted text-lg">
            {{ t('onboarding.nextSteps.description') }}
          </p>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <!-- Unraid Basics -->
        <div class="border-muted bg-bg/50 flex h-full flex-col rounded-lg border p-5">
          <div class="border-muted mb-4 flex items-center gap-2 border-b pb-2">
            <!-- Unraid Icon -->
            <div
              class="text-primary h-5 w-5 [&>svg]:h-full [&>svg]:w-full [&>svg]:fill-current"
              v-html="UnraidIconSvg"
            />
            <h3 class="text-highlighted text-sm font-bold tracking-wider uppercase">
              {{ t('onboarding.nextSteps.basics') }}
            </h3>
          </div>

          <ul class="flex-grow space-y-3">
            <li v-for="item in basicsItems" :key="item.label">
              <a
                :href="item.url"
                target="_blank"
                rel="noopener noreferrer"
                @click.stop
                class="text-primary hover:text-primary/60 group flex items-center gap-2 text-sm transition-colors hover:underline"
              >
                <span
                  class="bg-primary group-hover:bg-primary/60 h-1.5 w-1.5 flex-shrink-0 rounded-full transition-colors"
                />
                {{ item.label }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Stay in Touch -->
        <div class="border-muted bg-bg/50 flex h-full flex-col rounded-lg border p-5">
          <div class="border-muted mb-4 flex items-center gap-2 border-b pb-2">
            <ChatBubbleBottomCenterTextIcon class="text-primary h-5 w-5" />
            <h3 class="text-highlighted text-sm font-bold tracking-wider uppercase">
              {{ t('onboarding.nextSteps.stayInTouch') }}
            </h3>
          </div>

          <div class="grid flex-grow grid-cols-1 content-start gap-3">
            <!-- Newsletter (Unraid Orange) -->
            <a
              href="https://newsletter.unraid.net/"
              target="_blank"
              rel="noopener noreferrer"
              @click.stop
              class="group border-accented text-primary relative w-full overflow-hidden rounded-md border px-4 py-3 shadow-sm transition-colors duration-300 hover:border-transparent"
              style="--brand-bg: #f15a24; --x: 50%; --y: 50%"
              @mousemove="handleMouseMove"
            >
              <!-- Circle Fill Animation -->
              <div
                class="absolute z-0 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-[var(--brand-bg)] transition-transform duration-500 ease-in-out group-hover:scale-100"
                style="width: 300%; padding-bottom: 300%; left: var(--x); top: var(--y)"
              />
              <div
                class="relative z-10 flex items-center gap-3 transition-colors duration-300 group-hover:text-white"
              >
                <EnvelopeIcon class="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                <span>{{ t('onboarding.nextSteps.stayInTouch.newsletter') }}</span>
              </div>
            </a>

            <!-- YouTube (Red) -->
            <a
              href="https://www.youtube.com/@uncastshow"
              target="_blank"
              rel="noopener noreferrer"
              @click.stop
              class="group border-accented text-primary relative w-full overflow-hidden rounded-md border px-4 py-3 shadow-sm transition-colors duration-300 hover:border-transparent"
              style="--brand-bg: #ff0000; --x: 50%; --y: 50%"
              @mousemove="handleMouseMove"
            >
              <div
                class="absolute z-0 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-[var(--brand-bg)] transition-transform duration-500 ease-in-out group-hover:scale-100"
                style="width: 300%; padding-bottom: 300%; left: var(--x); top: var(--y)"
              />
              <div
                class="relative z-10 flex items-center gap-3 transition-colors duration-300 group-hover:text-white"
              >
                <!-- YouTube SVG -->
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  class="h-5 w-5 fill-current transition-transform group-hover:scale-110"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                  />
                </svg>
                <span>{{ t('onboarding.nextSteps.stayInTouch.youtube') }}</span>
              </div>
            </a>

            <!-- Discord (Blurple) -->
            <a
              href="https://discord.unraid.net/"
              target="_blank"
              rel="noopener noreferrer"
              @click.stop
              class="group border-accented text-primary relative w-full overflow-hidden rounded-md border px-4 py-3 shadow-sm transition-colors duration-300 hover:border-transparent"
              style="--brand-bg: #5865f2; --x: 50%; --y: 50%"
              @mousemove="handleMouseMove"
            >
              <div
                class="absolute z-0 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-[var(--brand-bg)] transition-transform duration-500 ease-in-out group-hover:scale-100"
                style="width: 300%; padding-bottom: 300%; left: var(--x); top: var(--y)"
              />
              <div
                class="relative z-10 flex items-center gap-3 transition-colors duration-300 group-hover:text-white"
              >
                <!-- Discord SVG -->
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  class="h-5 w-5 fill-current transition-transform group-hover:scale-110"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
                  />
                </svg>
                <span>{{ t('onboarding.nextSteps.stayInTouch.discord') }}</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      <!-- Partner Box (Optional Row) - Only show if there's any content -->
      <div
        v-if="hasAnyPartnerContent"
        class="border-primary/20 bg-primary/5 relative mt-6 overflow-hidden rounded-lg border p-6"
      >
        <!-- Decorative background hint -->
        <div class="pointer-events-none absolute top-0 right-0 p-4 opacity-10">
          <ServerIcon class="text-primary h-24 w-24" />
        </div>

        <div class="text-primary mb-5 flex items-center gap-2">
          <ServerIcon class="h-5 w-5" />
          <h3 class="text-sm font-bold tracking-wider uppercase">
            {{ t('onboarding.nextSteps.learnServer') }}
          </h3>
        </div>

        <div class="relative z-10 flex flex-col gap-6 text-left">
          <!-- Top Row: Specs and Core Docs -->
          <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
            <!-- Specs -->
            <div class="space-y-4">
              <div
                v-if="activationCode?.system?.serverName || activationCode?.system?.model"
                class="space-y-1"
              >
                <p class="text-muted text-xs font-bold tracking-wide uppercase opacity-70">
                  {{ t('onboarding.nextSteps.specs') }}
                </p>
                <div class="flex flex-col gap-0.5">
                  <span
                    v-if="activationCode?.system?.serverName"
                    class="text-highlighted text-lg font-bold"
                    >{{ activationCode.system.serverName }}</span
                  >
                  <span v-if="activationCode?.system?.model" class="text-muted font-medium">{{
                    activationCode.system.model
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Core Docs - Only show if there are any core doc links -->
            <div v-if="hasCoreDocsLinks" class="space-y-2">
              <a
                v-if="partnerInfo?.partner?.manualUrl"
                :href="partnerInfo.partner.manualUrl"
                target="_blank"
                @click.stop
                class="text-primary hover:text-primary/80 flex items-center gap-2 font-medium hover:underline"
              >
                <BookOpenIcon class="h-5 w-5 flex-shrink-0" />
                <span>{{ t('onboarding.nextSteps.manual') }}</span>
              </a>
              <a
                v-if="partnerInfo?.partner?.hardwareSpecsUrl"
                :href="partnerInfo.partner.hardwareSpecsUrl"
                target="_blank"
                @click.stop
                class="text-primary hover:text-primary/80 flex items-center gap-2 font-medium hover:underline"
              >
                <ClipboardDocumentListIcon class="h-5 w-5 flex-shrink-0" />
                <span>{{ t('onboarding.nextSteps.hardwareSpecs') }}</span>
              </a>
              <a
                v-if="partnerInfo?.partner?.supportUrl"
                :href="partnerInfo.partner.supportUrl"
                target="_blank"
                @click.stop
                class="text-primary hover:text-primary/80 flex items-center gap-2 font-medium hover:underline"
              >
                <WrenchScrewdriverIcon class="h-5 w-5 flex-shrink-0" />
                <span>{{ t('onboarding.nextSteps.support') }}</span>
              </a>
            </div>
          </div>

          <!-- Additional Links -->
          <div v-if="hasExtraLinks" class="border-primary/10 border-t pt-4">
            <p class="text-muted mb-2 text-xs font-bold tracking-wide uppercase opacity-70">
              Additional Links
            </p>
            <ul class="space-y-1.5">
              <li v-for="link in partnerInfo?.partner?.extraLinks" :key="link.title">
                <a
                  :href="link.url"
                  target="_blank"
                  @click.stop
                  class="text-primary hover:text-primary/80 flex items-center gap-2 text-sm hover:underline"
                >
                  <LinkIcon class="h-4 w-4 flex-shrink-0 opacity-70" />
                  {{ link.title }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="border-muted mt-8 flex flex-col-reverse items-center justify-between gap-6 border-t pt-8 sm:flex-row"
      >
        <button
          v-if="showBack"
          @click="props.onBack"
          class="text-muted hover:text-toned group flex items-center justify-center gap-2 font-medium transition-colors sm:w-auto sm:justify-start"
        >
          <ChevronLeftIcon class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
          {{ t('common.back') }}
        </button>
        <div v-else class="hidden w-1 sm:block" />

        <BrandButton
          :text="t('onboarding.nextSteps.continueToDashboard')"
          class="!bg-primary hover:!bg-primary/90 w-full min-w-[200px] !text-white shadow-md transition-all hover:shadow-lg sm:w-auto"
          @click="props.onComplete"
          :icon-right="CheckCircleIcon"
        />
      </div>
    </div>
  </div>
</template>
