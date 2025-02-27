<script lang="ts" setup>
// import { useI18n } from 'vue-i18n';

// const { t } = useI18n();

import { useQuery } from '@vue/apollo-composable';

import { JsonForms } from '@jsonforms/vue';
import { vanillaRenderers } from '@jsonforms/vue-vanilla';
import { extendedVuetifyRenderers } from '@jsonforms/vue-vuetify';

import { getConnectSettingsForm } from './graphql/settings.query';
import { formSwitchEntry } from './renderer/switch.renderer';

const { result } = useQuery(getConnectSettingsForm);
const renderers = [
  // ...vanillaRenderers,
  ...extendedVuetifyRenderers,
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
enum IIU {
  A,
  B,
}
const dummyData = ref({
  access: false,
  dummy: 'sd',
  iiu: IIU.A,
});
const config = {
  restrict: false,
  trim: false,
}
</script>

<template>
  <AuthCe />
  <!-- @todo: flashback up -->
  <div><JsonForms
    v-if="result"
    :schema="dataSchema"
    :uischema="uiSchema"
    :renderers="renderers"
    :config="config"
  /></div>
  <WanIpCheckCe />
  <ConnectSettingsRemoteAccess />
  <ConnectSettingsAllowedOrigins />
  <DownloadApiLogsCe />
</template>
<style>
@import '@jsonforms/vue-vuetify/lib/jsonforms-vue-vuetify.css';
</style>
