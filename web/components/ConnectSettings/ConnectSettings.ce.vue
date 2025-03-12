<script lang="ts" setup>
// import { useI18n } from 'vue-i18n';

// const { t } = useI18n();

import { useMutation, useQuery } from '@vue/apollo-composable';

// import { extendedVuetifyRenderers } from '@jsonforms/vue-vuetify';
import { BrandButton, Label } from '@unraid/ui';
import { JsonForms } from '@jsonforms/vue';
import { vanillaRenderers } from '@jsonforms/vue-vanilla';

import type { ConnectSettingsValues } from '~/composables/gql/graphql';

import { getConnectSettingsForm, updateConnectSettings } from './graphql/settings.query';
import {
  formSelectEntry,
  formSwitchEntry,
  numberFieldEntry,
  preconditionsLabelEntry,
} from './renderer/renderer-entries';
import { stringArrayEntry } from './renderer/string-array.renderer';

const {
  mutate: updateSettings,
  loading: updateSettingsLoading,
  error: updateSettingsError,
  onDone: onUpdateDone,
} = useMutation(updateConnectSettings);
const isUpdating = ref(false);
const reactionMessage = ref('');
watchDebounced(
  updateSettingsLoading,
  (loading) => {
    isUpdating.value = loading;
  },
  {
    debounce: 100,
  }
);
onUpdateDone(() => {
  globalThis.toast?.success('Updated API Settings');
  if (!globalThis.toast) {
    reactionMessage.value = 'Updated API Settings <span class="text-green-500">✓</span>';
    setTimeout(() => {
      reactionMessage.value = '';
    }, 3000);
  }
});

const { result } = useQuery(getConnectSettingsForm);
const renderers = [
  ...vanillaRenderers,
  // ...extendedVuetifyRenderers,
  formSwitchEntry,
  formSelectEntry,
  numberFieldEntry,
  preconditionsLabelEntry,
  // verticalLayoutEntry,
  stringArrayEntry,
  // custom renderers here
];
const formSettings = ref<Partial<ConnectSettingsValues>>({});
const settings = computed(() => {
  if (!result.value) return;
  return result.value?.connect.settings;
});
watch(result, () => {
  if (!result.value) return;
  const { __typename, ...initialValues } = result.value.connect.settings.values;
  console.log('[ConnectSettings] current settings', initialValues);
  formSettings.value = initialValues;
});
const config = {
  restrict: false,
  trim: false,
};

const debugData = async () => {
  console.log('[ConnectSettings] trying to update settings to', formSettings.value);
  await updateSettings({ input: formSettings.value });
};
const onChange = ({ data: fdata, errors }: { data: Record<string, unknown>; errors: string[] }) => {
  console.log('[ConnectSettings] form touched', fdata);
  console.error('[ConnectSettings] errors', errors);
  formSettings.value = fdata;
};
</script>

<template>
  <div
    class="grid grid-cols-settings items-baseline pl-3 gap-y-6 [&>*:nth-child(odd)]:text-end [&>*:nth-child(even)]:ml-10"
  >
    <Label>Account Status:</Label>
    <div v-html="'<unraid-i18n-host><unraid-auth></unraid-auth></unraid-i18n-host>'"></div>
    <!-- <div>
      <Label>Allowed Origins:</Label>
      <p class="italic mt-1">
        Provide a comma separated list of urls that are allowed to access the unraid-api.<br>
        e.g. (https://abc.myreverseproxy.com,https://xyz.rvrsprx.com,…)
      </p>
    </div>
    <ConnectSettingsAllowedOrigins /> -->
    <!-- <Label>WAN IP Check:</Label>
    <div
      v-html="'<unraid-i18n-host><unraid-wan-ip-check></unraid-wan-ip-check></unraid-i18n-host>'"
    ></div>
    <Label>Remote Access (Deprecated):</Label>
    <ConnectSettingsRemoteAccess /> -->
    <Label>Download Unraid API Logs:</Label>
    <div
      v-html="
        '<unraid-i18n-host><unraid-download-api-logs></unraid-download-api-logs></unraid-i18n-host>'
      "
    ></div>
  </div>
  <!-- @todo: flashback up -->
  <div class="mt-6 pl-3 [&_.vertical-layout]:space-y-6">
    <JsonForms
      v-if="settings"
      :schema="settings.dataSchema"
      :uischema="settings.uiSchema"
      :data="formSettings"
      :renderers="renderers"
      :config="config"
      :readonly="isUpdating"
      @change="onChange"
    />
    <div class="mt-6 grid grid-cols-settings gap-y-6 items-baseline">
      <p v-if="reactionMessage" class="text-sm text-end" v-html="reactionMessage"></p>
      <div class="col-start-2 ml-10 space-y-4">
        <BrandButton
          variant="outline-primary"
          padding="lean"
          size="12px"
          class="leading-normal"
          @click="debugData"
        >
          Apply
        </BrandButton>

        <p v-if="updateSettingsError" class="text-sm text-unraid-red-500">
          ✕ Error: {{ updateSettingsError.message }}
        </p>
      </div>
    </div>
  </div>
</template>
<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
@import '../../assets/main.css';
</style>
