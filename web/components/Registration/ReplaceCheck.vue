<script setup lang="ts">
import {
  CheckCircleIcon,
  KeyIcon,
  XCircleIcon,
  ShieldExclamationIcon,
} from '@heroicons/vue/24/solid';
import { storeToRefs } from 'pinia';
import type { WretchError } from 'wretch';

import { validateGuid, type ValidateGuidPayload } from '~/composables/services/keyServer';
import { useServerStore } from '~/store/server';

import BrandLoadingWhite from '~/components/Brand/LoadingWhite.vue';
import { storeKeyNameFromField } from '@apollo/client/utilities';

const props = defineProps<{
  t: any;
}>();

const { guid } = storeToRefs(useServerStore());

const error = ref<{
  name: string;
  message: string;
  stack?: string | undefined;
  cause?: unknown;
} | null>(null);
const status = ref<'checking' | 'eligible' | 'error' | 'ineligible' | 'ready'>(guid.value ? 'ready' : 'error');
const statusOutput = computed(() => {
  switch (status.value) {
    case 'eligible':
      return {
        classes: 'text-green-500',
        icon: CheckCircleIcon,
        text: props.t('Eligible'),
      };

    case 'ineligible':
      return {
        classes: 'text-red-500',
        icon: XCircleIcon,
        text: props.t('Ineligible'),
      };

    case 'error':
      return {
        classes: 'text-red-500',
        icon: ShieldExclamationIcon,
        text: error.value?.message || 'Unknown error',
      };

    default: return null;
  }
});
const validationResponse = ref<ValidateGuidPayload | undefined>(sessionStorage.getItem('replaceCheck') ? JSON.parse(sessionStorage.getItem('replaceCheck') as string) : undefined);

const check = async () => {
  if (!guid.value) {
    status.value = 'error';
    error.value = { name: 'Error', message: props.t('Flash GUID required') };
  }

  try {
    status.value = 'checking';
    error.value = null;
    const response: ValidateGuidPayload = await validateGuid({ guid: guid.value }).json();
    sessionStorage.setItem('replaceCheck', JSON.stringify(response));
    status.value = response?.replaceable ? 'eligible' : 'ineligible';
  } catch (err) {
    const catchError = err as WretchError;
    status.value = 'error';
    error.value = catchError?.message ? catchError : { name: 'Error', message: 'Unknown error' };
    console.error('[ReplaceCheck.check]', catchError);
  }
};

/**
 * If we already have a validation response, set the status to eligible or ineligible
 */
onBeforeMount(() => {
  if (validationResponse.value) {
    status.value = validationResponse.value?.replaceable ? 'eligible' : 'ineligible';
  }
});
</script>

<template>
  <div class="flex flex-col">
    <BrandButton
      v-if="status === 'checking' || status === 'ready'"
      @click="check"
      :disabled="status !== 'ready'"
      :icon="status === 'checking' ? BrandLoadingWhite : KeyIcon"
      :text="t('Check Eligibility')"
      class="w-full sm:max-w-300px"
      />

    <p
      v-else-if="statusOutput"
      class="flex flex-row items-center gap-x-4px"
      :class="[statusOutput?.classes]"
    >
      <component
        v-if="statusOutput?.icon"
        :is="statusOutput?.icon"
        class="w-16px fill-current" />
      {{ statusOutput?.text }}
    </p>
  </div>
</template>
