<script setup lang="ts">
/**
 * @todo complete this component
 */
import { Switch, SwitchGroup, SwitchLabel } from '@headlessui/vue';
import { ref } from 'vue';

defineProps<{
  label: string;
}>();

const checked = ref(false);
</script>
<template>
  <SwitchGroup as="div">
    <div class="flex shrink-0 items-center gap-4">
      <Switch
        v-model="checked"
        :class="[
          checked ? 'bg-green-500' : 'bg-gray-200',
          'relative inline-flex h-6 w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2',
        ]"
      >
        <span
          :class="[
            checked ? 'translate-x-5' : 'translate-x-0',
            'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
          ]"
        >
          <span
            :class="[
              checked ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in',
              'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
            ]"
            aria-hidden="true"
          >
            <svg class="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
              <path
                d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span
            :class="[
              checked ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out',
              'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
            ]"
            aria-hidden="true"
          >
            <svg class="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 12 12">
              <path
                d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z"
              />
            </svg>
          </span>
        </span>
      </Switch>
      <SwitchLabel class="text-sm">
        {{ label }}
      </SwitchLabel>
    </div>
  </SwitchGroup>
</template>
