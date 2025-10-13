<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';

import { XMarkIcon } from '@heroicons/vue/24/outline';
import { Button, cn } from '@unraid/ui';
import { TransitionChild, TransitionRoot } from '@headlessui/vue';

export interface Props {
  centerContent?: boolean;
  description?: string;
  error?: boolean;
  maxWidth?: string;
  open?: boolean;
  showCloseX?: boolean;
  success?: boolean;
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
const { t } = useI18n();
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
        class="fixed inset-0 flex min-h-screen w-screen flex-col items-center overflow-y-auto p-2 sm:p-4"
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
            :title="showCloseX ? t('modal.clickToCloseModal') : undefined"
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
              disableShadow ? 'border-none shadow-none' : 'shadow-xl',
              error ? 'shadow-unraid-red/30 border-unraid-red/10' : '',
              success ? 'border-green-600/10 shadow-green-600/30' : '',
              !error && !success && !disableShadow ? 'shadow-orange/10' : '',
            ]"
            class="text-foreground bg-background border-muted relative z-10 mx-auto flex transform flex-col justify-around overflow-hidden rounded-lg border-2 border-solid text-left text-base transition-all"
          >
            <div v-if="showCloseX" class="absolute top-0 right-0 z-20 pt-1 pr-1 sm:block">
              <Button
                variant="ghost"
                size="icon"
                class="text-foreground hover:bg-unraid-red focus:bg-unraid-red rounded-md hover:text-white focus:text-white"
                :aria-label="t('common.close')"
                @click="closeModal"
              >
                <XMarkIcon class="h-6 w-6" aria-hidden="true" />
              </Button>
            </div>

            <header
              class="relative z-0 grid items-start gap-2 rounded-t p-4 md:p-6"
              :class="{
                'sm:pr-10': showCloseX,
                'justify-between': !headerJustifyCenter,
                'justify-center': headerJustifyCenter,
              }"
            >
              <div class="bg-card absolute inset-0 -z-10 opacity-10" />
              <template v-if="!$slots['header']">
                <h1
                  v-if="title && !titleInMain"
                  :id="ariaLablledById"
                  class="flex flex-wrap justify-center gap-x-1 text-center text-xl font-semibold sm:text-2xl"
                >
                  {{ title }}
                  <slot name="headerTitle" />
                </h1>
              </template>
              <slot name="header" />
            </header>

            <div
              v-if="$slots['main'] || description"
              class="tall:max-h-[75vh] relative flex max-h-[65vh] flex-col gap-y-4 overflow-y-auto p-4 sm:gap-y-6 md:p-6"
              :class="[centerContent && 'text-center', !disableShadow && 'shadow-inner']"
            >
              <div class="flex flex-col gap-y-3">
                <h1
                  v-if="title && titleInMain"
                  :id="ariaLablledById"
                  class="flex flex-wrap justify-center gap-x-1 text-center text-xl font-semibold sm:text-2xl"
                >
                  {{ title }}
                  <slot name="headerTitle" />
                </h1>
                <h2 v-if="description" class="text-lg opacity-75 sm:text-xl" v-html="description" />
              </div>
              <div v-if="$slots['main']">
                <slot name="main" />
              </div>
            </div>

            <footer v-if="$slots['footer']" class="relative p-4 text-sm md:p-6">
              <div class="bg-popover absolute inset-0 z-0 opacity-10" />
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
          <div v-if="$slots['subFooter']" class="mx-auto mt-4 flex justify-center" :class="[maxWidth]">
            <slot name="subFooter" />
          </div>
        </TransitionChild>
      </div>
    </div>
  </TransitionRoot>
</template>
