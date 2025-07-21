<script setup lang="ts">
import { computed, watchEffect } from 'vue';

import { XMarkIcon } from '@heroicons/vue/24/outline';
import { cn } from '@unraid/ui';
import { TransitionChild, TransitionRoot } from '@headlessui/vue';

import type { ComposerTranslation } from 'vue-i18n';

export interface Props {
  centerContent?: boolean;
  description?: string;
  error?: boolean;
  maxWidth?: string;
  open?: boolean;
  showCloseX?: boolean;
  success?: boolean;
  t: ComposerTranslation;
  tallContent?: boolean;
  title?: string;
  titleInMain?: boolean;
  headerJustifyCenter?: boolean;
  overlayColor?: string;
  overlayOpacity?: string;
  modalVerticalCenter?: boolean | string;
  disableShadow?: boolean;
  disableOverlayClose?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  centerContent: true,
  description: '',
  error: false,
  maxWidth: 'sm:max-w-lg',
  open: false,
  showCloseX: false,
  success: false,
  tallContent: false,
  title: '',
  titleInMain: false,
  headerJustifyCenter: true,
  overlayColor: 'bg-black',
  overlayOpacity: 'bg-black/80',
  modalVerticalCenter: true,
  disableShadow: false,
  disableOverlayClose: false,
});
watchEffect(() => {
  // toggle body scrollability
  if (props.open) {
    document.body.style.setProperty('overflow', 'hidden');
  } else {
    document.body.style.removeProperty('overflow');
  }
});

const emit = defineEmits(['close']);
const closeModal = () => {
  emit('close');
};

const ariaLablledById = computed<string | undefined>(() =>
  props.title ? `ModalTitle-${Math.random()}`.replace('0.', '') : undefined
);
const computedVerticalCenter = computed<string>(() => {
  if (props.tallContent) {
    return 'justify-start sm:justify-center';
  }
  if (typeof props.modalVerticalCenter === 'string') {
    return props.modalVerticalCenter;
  }
  return props.modalVerticalCenter ? 'justify-center' : 'justify-start';
});
</script>

<template>
  <TransitionRoot appear :show="open">
    <div
      class="fixed inset-0 z-10 overflow-y-auto"
      role="dialog"
      aria-dialog="true"
      :aria-labelledby="ariaLablledById"
      tabindex="-1"
      @keyup.esc="closeModal"
    >
      <div
        class="fixed inset-0 flex flex-col min-h-screen w-screen items-center p-2 sm:p-4 overflow-y-auto"
        :class="computedVerticalCenter"
      >
        <TransitionChild
          appear
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div
            :class="cn('fixed inset-0 z-0 transition-opacity', overlayColor, overlayOpacity)"
            :title="showCloseX ? t('Click to close modal') : undefined"
            @click="!disableOverlayClose ? closeModal : undefined"
          />
        </TransitionChild>
        <TransitionChild
          appear
          enter="duration-300 ease-out"
          enter-from="opacity-0 scale-95"
          enter-to="opacity-100 scale-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100 scale-100"
          leave-to="opacity-0 scale-95"
          class="w-full"
        >
          <div
            :class="[
              maxWidth,
              disableShadow ? 'shadow-none border-none' : 'shadow-xl',
              error ? 'shadow-unraid-red/30 border-unraid-red/10' : '',
              success ? 'shadow-green-600/30 border-green-600/10' : '',
              !error && !success && !disableShadow ? 'shadow-orange/10 border-white/10' : '',
            ]"
            class="text-base text-foreground bg-background text-left relative z-10 mx-auto flex flex-col justify-around border-2 border-solid transform overflow-hidden rounded-lg transition-all"
          >
            <div v-if="showCloseX" class="absolute z-20 right-0 top-0 pt-1 pr-1 sm:block">
              <button
                class="rounded-md text-foreground bg-transparent p-2 hover:text-white focus:text-white hover:bg-unraid-red focus:bg-unraid-red focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                type="button"
                @click="closeModal"
              >
                <span class="sr-only">{{ t('Close') }}</span>
                <XMarkIcon class="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <header
              class="relative z-0 grid items-start gap-2 p-4 md:p-6 rounded-t"
              :class="{
                'sm:pr-10': showCloseX,
                'justify-between': !headerJustifyCenter,
                'justify-center': headerJustifyCenter,
              }"
            >
              <div class="absolute -z-10 inset-0 opacity-10 bg-card" />
              <template v-if="!$slots['header']">
                <h1
                  v-if="title && !titleInMain"
                  :id="ariaLablledById"
                  class="text-center text-xl sm:text-2xl font-semibold flex flex-wrap justify-center gap-x-1"
                >
                  {{ title }}
                  <slot name="headerTitle" />
                </h1>
              </template>
              <slot name="header" />
            </header>

            <div
              v-if="$slots['main'] || description"
              class="relative max-h-[65vh] tall:max-h-[75vh] flex flex-col gap-y-4 sm:gap-y-6 p-4 md:p-6 overflow-y-auto"
              :class="[centerContent && 'text-center', !disableShadow && 'shadow-inner']"
            >
              <div class="flex flex-col gap-y-3">
                <h1
                  v-if="title && titleInMain"
                  :id="ariaLablledById"
                  class="text-center text-xl sm:text-2xl font-semibold flex flex-wrap justify-center gap-x-1"
                >
                  {{ title }}
                  <slot name="headerTitle" />
                </h1>
                <h2 v-if="description" class="text-lg sm:text-xl opacity-75" v-html="description" />
              </div>
              <div v-if="$slots['main']">
                <slot name="main" />
              </div>
            </div>

            <footer v-if="$slots['footer']" class="text-sm relative p-4 md:p-6">
              <div class="absolute z-0 inset-0 opacity-10 bg-popover" />
              <div class="relative z-10">
                <slot name="footer" />
              </div>
            </footer>
          </div>
        </TransitionChild>

        <TransitionChild
          appear
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div v-if="$slots['subFooter']" class="mt-4 flex justify-center mx-auto" :class="[maxWidth]">
            <slot name="subFooter" />
          </div>
        </TransitionChild>
      </div>
    </div>
  </TransitionRoot>
</template>
