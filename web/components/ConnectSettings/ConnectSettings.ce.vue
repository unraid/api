<script lang="ts" setup>
// import { useI18n } from 'vue-i18n';

// const { t } = useI18n();

import { useQuery } from '@vue/apollo-composable';

// import { extendedVuetifyRenderers } from '@jsonforms/vue-vuetify';
import { Button, Label } from '@unraid/ui';
import { JsonForms } from '@jsonforms/vue';
import { vanillaRenderers } from '@jsonforms/vue-vanilla';

import { getConnectSettingsForm } from './graphql/settings.query';
import { formSwitchEntry } from './renderer/switch.renderer';

const { result } = useQuery(getConnectSettingsForm);
const renderers = [
  ...vanillaRenderers,
  // ...extendedVuetifyRenderers,
  formSwitchEntry,
  // custom renderers here
];
const dataSchema = computed(() => {
  if (!result.value) return;
  return result.value?.connectSettingsForm.dataSchema;
});
const uiSchema = computed(() => {
  if (!result.value) return;
  return result.value?.connectSettingsForm.uiSchema;
});
watchImmediate(result, () => {
  console.log('connect settings', result.value);
});
const config = {
  restrict: false,
  trim: false,
};
const data = ref({});
const debugData = () => {
  console.log('[ConnectSettings] data', data.value);
};
const onChange = ({ data: fdata, errors }) => {
  console.log('[ConnectSettings] data', fdata);
  console.log('[ConnectSettings] errors', errors);
  data.value = fdata;
};
</script>

<template>
  <div class="grid grid-cols-12 items-baseline gap-6 [&>*:nth-child(odd)]:text-end [&>*:nth-child(odd)]:col-span-4 [&>*:nth-child(even)]:col-span-8">
    <Label>Account Status:</Label>
    <AuthCe />
    <Label>Download Unraid API Logs:</Label>
    <DownloadApiLogsCe />
    <Label>WAN IP Check:</Label>
    <WanIpCheckCe />
    <Label>Allowed Origins:</Label>
    <ConnectSettingsAllowedOrigins />
  </div>
  <!-- @todo: flashback up -->
  <div>
    <JsonForms
      v-if="result"
      :schema="dataSchema"
      :uischema="uiSchema"
      :renderers="renderers"
      :config="config"
      @change="onChange"
    />
    <Button @click="debugData">Debug data</Button>
  </div>
  <ConnectSettingsRemoteAccess />
</template>
<style>
@import '@jsonforms/vue-vuetify/lib/jsonforms-vue-vuetify.css';
</style>
