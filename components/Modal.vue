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
</script>

<template>
  <TransitionRoot appear :show="open" as="template">
    <div @keyup.esc="closeModal" ref="trapRef" class="fixed inset-0 z-10 overflow-y-auto" role="dialog" aria-dialog="true" :aria-labelledby="ariaLablledById" tabindex="-1">
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
          @click="closeModal"
          class="fixed inset-0 z-0 bg-black bg-opacity-50 transition-opacity"
          title="Click to close modal"
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
              error ? 'shadow-unraid-unraid-red/30' : '',
              success ? 'shadow-green-400-400/30' : '',
              !error && !success ? 'shadow-orange/10' : '',
            ]"
            class="text-alpha bg-beta relative transform overflow-hidden rounded-lg px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:p-6"
          >
            <div v-if="showCloseX" class="absolute z-20 right-0 top-0 hidden pt-2 pr-2 sm:block">
              <button @click="closeModal" type="button" class="rounded-md text-alpha bg-beta p-2 hover:text-white focus:text-white hover:bg-unraid-red focus:bg-unraid-red focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                <span class="sr-only">Close</span>
                <XMarkIcon class="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <h1 v-if="title" :id="ariaLablledById">{{ title }}</h1>
            <h2 v-if="description">{{ description }}</h2>
            <slot />
          </div>
        </TransitionChild>
      </div>
    </div>
  </TransitionRoot>
</template>
