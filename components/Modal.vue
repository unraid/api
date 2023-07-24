<script setup lang="ts">
import { TransitionChild, TransitionRoot } from '@headlessui/vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import useFocusTrap from '~/composables/useFocusTrap';

export interface Props {
  description?: string;
  error?: boolean;
  maxWidth?: string;
  open?: boolean;
  showCloseX?: boolean;
  success?: boolean;
  title?: string;
}
const props = withDefaults(defineProps<Props>(), {
  error: false,
  maxWidth: 'sm:max-w-lg',
  open: false,
  showCloseX: false,
  success: false,
});
watchEffect(() => {
  // toggle body scrollability
  return props.open
    ? document.body.style.setProperty('overflow', 'hidden')
    : document.body.style.removeProperty('overflow');
});

const emit = defineEmits(['close']);
const closeModal = () => {
  emit('close');
};

const { trapRef } = useFocusTrap();

const ariaLablledById = computed((): string|undefined => props.title ? `ModalTitle-${Math.random()}`.replace('0.', '') : undefined);

/**
 * @todo when providing custom colors for theme we should invert text-beta bg-alpha to text-alpha bg-beta
 */
</script>

<template>
  <TransitionRoot appear :show="open" as="template">
    <div
      ref="trapRef"
      class="fixed inset-0 z-10 overflow-y-auto"
      role="dialog"
      aria-dialog="true"
      :aria-labelledby="ariaLablledById"
      tabindex="-1"
      @keyup.esc="closeModal"
    >
      <TransitionChild
        appear
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div
          class="fixed inset-0 z-0 bg-black bg-opacity-80 transition-opacity"
          title="Click to close modal"
          @click="closeModal"
        />
      </TransitionChild>
      <div class="text-center flex min-h-full items-center justify-center p-4 md:p-0">
        <TransitionChild
          appear
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0 scale-95"
          enter-to="opacity-100 scale-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100 scale-100"
          leave-to="opacity-0 scale-95"
        >
          <div
            :class="[
              maxWidth,
              error ? 'shadow-unraid-red/30 border-unraid-red/10' : '',
              success ? 'shadow-green-600/30 border-green-600/10' : '',
              !error && !success ? 'shadow-orange/10 border-white/10' : '',
            ]"
            class="text-16px text-beta bg-alpha text-left relative flex flex-col justify-around p-16px my-24px sm:p-24px border-2 border-solid shadow-xl transform overflow-hidden rounded-lg transition-all sm:w-full"
          >
            <div v-if="showCloseX" class="absolute z-20 right-0 top-0 hidden pt-2 pr-2 sm:block">
              <button type="button" class="rounded-md text-beta bg-alpha p-2 hover:text-white focus:text-white hover:bg-unraid-red focus:bg-unraid-red focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" @click="closeModal">
                <span class="sr-only">Close</span>
                <XMarkIcon class="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <header class="text-center">
              <template v-if="!$slots['header']">
                <h1 v-if="title" :id="ariaLablledById" class="text-24px font-semibold flex flex-wrap justify-center gap-x-1">
                  {{ title }}
                  <slot name="headerTitle" />
                </h1>
                <h2 v-if="description" class="text-20px opacity-75">
                  {{ description }}
                </h2>
              </template>
              <slot name="header" />
            </header>
            <slot name="main" />

            <footer v-if="$slots['footer']" class="text-14px relative -mx-16px -mb-16px sm:-mx-24px sm:-mb-24px p-4 sm:p-6">
              <div class="absolute z-0 inset-0 opacity-10 bg-beta" />
              <div class="relative z-10">
                <slot name="footer" />
              </div>
            </footer>
          </div>
        </TransitionChild>
      </div>
    </div>
  </TransitionRoot>
</template>
