<script setup lang="ts">
import { TransitionChild, TransitionRoot } from '@headlessui/vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import useFocusTrap from '~/composables/useFocusTrap';

export interface Props {
  description?: string;
  maxWidth?: string;
  open?: boolean;
  showCloseX?: boolean;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  maxWidth: 'sm:max-w-lg',
  open: false,
  showCloseX: false,
});

const emit = defineEmits(['close']);
const closeModal = () => {
  console.debug('[closeModal]');
  emit('close');
};

const { trapRef } = useFocusTrap();

const ariaLablledById = computed((): string|undefined => props.title ? `ModalTitle-${Math.random()}`.replace('0.', '') : undefined);

onMounted(() => {
  console.debug('[onMounted]');
  document.body.style.setProperty('overflow', 'hidden');
});

onBeforeUnmount(() => {
  document.removeEventListener('keyup', () => {});
  document.body.style.removeProperty('overflow');
});
</script>

<template>
  <div v-if="open" @keyup.esc="closeModal" ref="trapRef" class="fixed inset-0 z-10 overflow-y-auto" role="dialog" aria-dialog="true" :aria-labelledby="ariaLablledById" tabindex="-1">
    <div @click="closeModal" class="fixed inset-0 z-0 bg-black bg-opacity-50 transition-opacity" />
    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div :class="maxWidth" class="text-beta bg-alpha relative transform overflow-hidden rounded-lg px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:p-6">
        <div v-if="showCloseX" class="absolute z-20 right-0 top-0 hidden pt-2 pr-2 sm:block">
          <button @click="closeModal" type="button" class="rounded-md bg-alpha text-gray-400 p-2 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            <span class="sr-only">Close</span>
            <XMarkIcon class="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <h1 v-if="title" :id="ariaLablledById">{{ title }}</h1>
        <h2 v-if="description">{{ description }}</h2>
        <slot />
      </div>
    </div>
  </div>
</template>
