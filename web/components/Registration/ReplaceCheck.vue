<script setup lang="ts">
import {
  ArrowTopRightOnSquareIcon,
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

const props = defineProps<{
  t: any;
}>();

const { guid, keyfile } = storeToRefs(useServerStore());

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
        color: 'green',
        icon: CheckCircleIcon,
        text: props.t('Eligible'),
      };

    case 'ineligible':
      return {
        color: 'red',
        icon: XCircleIcon,
        text: props.t('Ineligible'),
      };

    case 'error':
      return {
        color: 'red',
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
    /**
     * @todo will eventually take a keyfile and provide renewal details. If this says there's a reneal key available then we'll make a separate request to replace / swap the new key. We'll also use this to update the keyfile to the new key type for legacy users.
     * endpoint will be through key server
     * this should happen automatically when the web components are mounted…
     * account.unraid.net will do a similar thing`
     */
    const response: ValidateGuidPayload = await validateGuid({
      guid: guid.value,
      keyfile: keyfile.value,
    }).json();
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
      class="flex flex-col sm:flex-row items-start justify-between gap-4px"
    >
      <UiBadge :color="statusOutput.color" :icon="statusOutput.icon" size="16px">
        {{ statusOutput.text }}
      </UiBadge>
      <BrandButton
        v-if="status === 'eligible' || status === 'ineligible'"
        btn-style="underline"
        :external="true"
        :href="'https://docs.unraid.net/unraid-os/manual/changing-the-flash-device/'"
        :iconRight="ArrowTopRightOnSquareIcon"
        :text="t('Learn More')"
      />
    </p>
  </div>
</template>
