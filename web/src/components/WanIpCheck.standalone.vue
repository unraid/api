<script lang="ts" setup>
import { computed, onBeforeMount, ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

import { request } from '~/composables/services/request';
import { useServerStore } from '~/store/server';

export interface Props {
  phpWanIp?: string;
}

const props = defineProps<Props>();

const { t } = useI18n();

const { isRemoteAccess } = storeToRefs(useServerStore());

const wanIp = ref<string | null>();
const fetchError = ref<string>('');
const loading = ref(false);

const computedError = computed((): string => {
  if (!props.phpWanIp) {
    return t('wanIpCheck.dnsIssueUnableToResolveWanip4');
  }
  if (fetchError.value) {
    return fetchError.value;
  }
  return '';
});

onBeforeMount(() => {
  wanIp.value = sessionStorage.getItem('unraidConnect_wanIp');
});

watchEffect(async () => {
  // if we don't have a client WAN IP AND we have the server WAN IP then we fetch
  if (!wanIp.value && props.phpWanIp) {
    loading.value = true;

    const response = await request.url('https://wanip4.unraid.net/').get().text();

    if (response) {
      loading.value = false;
      wanIp.value = response as string; // response returns text nothing to traverse
      // save in sessionStorage so we only make this request once per webGUI session
      sessionStorage.setItem('unraidConnect_wanIp', wanIp.value);
    } else {
      loading.value = false;
      fetchError.value = t('wanIpCheck.unableToFetchClientWanIpv4');
    }
  }
});
</script>

<template>
  <div>
    <span v-if="loading" class="italic">{{ t('wanIpCheck.checkingWanIps') }}</span>
    <template v-else>
      <span v-if="computedError" class="text-unraid-red font-semibold">{{ computedError }}</span>
      <template v-else>
        <span v-if="isRemoteAccess || (phpWanIp === wanIp && !isRemoteAccess)">{{
          t('wanIpCheck.remarkYourWanIpv4Is', [wanIp])
        }}</span>
        <span v-else class="inline-block w-1/2 whitespace-normal">
          {{ t('wanIpCheck.remarkUnraidSWanIpv4Does', [phpWanIp, wanIp]) }}
          {{ t('wanIpCheck.thisMayIndicateAComplexNetwork') }}
          {{ t('wanIpCheck.ignoreThisMessageIfYouAre') }}
        </span>
      </template>
    </template>
  </div>
</template>
