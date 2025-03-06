<script lang="ts" setup>
// import { useI18n } from 'vue-i18n';

// const { t } = useI18n();

import { useQuery } from '@vue/apollo-composable';

// import { extendedVuetifyRenderers } from '@jsonforms/vue-vuetify';
import { Button, Label } from '@unraid/ui';
import { JsonForms } from '@jsonforms/vue';
import { vanillaRenderers } from '@jsonforms/vue-vanilla';

import { getConnectSettingsForm } from './graphql/settings.query';
import { formSelectEntry, formSwitchEntry, numberFieldEntry } from './renderer/renderer-entries';
import { stringArrayEntry } from './renderer/string-array.renderer';

const { result } = useQuery(getConnectSettingsForm);
const renderers = [
  ...vanillaRenderers,
  // ...extendedVuetifyRenderers,
  formSwitchEntry,
  formSelectEntry,
  numberFieldEntry,
  // verticalLayoutEntry,
  stringArrayEntry,
  // custom renderers here
];
const dataSchema = computed(() => {
  if (!result.value) return;
  return result.value?.connectSettingsForm.dataSchema;
});
const uiSchema = computed(() => {
  if (!result.value) return;
  // return result.value?.connectSettingsForm.uiSchema;
  return {
    type: 'VerticalLayout',
    elements: [
      {
        type: 'Control',
        scope: '#/properties/remoteAccess',
        label: 'Allow Remote Access',
      },
      {
        type: 'Control',
        scope: '#/properties/wanPort',
        label: 'WAN Port',
        rule: {
          effect: 'SHOW',
          condition: {
            scope: '#/properties/remoteAccess',
            schema: {
              enum: ['DYNAMIC_MANUAL', 'ALWAYS_MANUAL'],
            },
          },
        },
      },
      {
        type: 'Control',
        scope: '#/properties/sandbox',
        label: 'Enable Developer Sandbox:',
        options: {
          toggle: true,
        },
      },
      {
        type: 'Control',
        scope: '#/properties/extraOrigins',
        options: {
          inputType: 'url',
          placeholder: 'https://example.com',
        },
      },
    ],
  };
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
const onChange = ({ data: fdata, errors }: { data: Record<string, unknown>; errors: string[] }) => {
  console.log('[ConnectSettings] data', fdata);
  console.log('[ConnectSettings] errors', errors);
  data.value = fdata;
};
</script>

<template>
  <div
    class="grid grid-cols-12 items-baseline gap-6 [&>*:nth-child(odd)]:text-end [&>*:nth-child(odd)]:col-span-4 [&>*:nth-child(even)]:col-span-8"
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
  <div class="mt-6 [&_.vertical-layout]:space-y-6">
    <JsonForms
      v-if="result"
      :schema="dataSchema"
      :uischema="uiSchema"
      :renderers="renderers"
      :config="config"
      @change="onChange"
    />
    <div class="mt-6 grid grid-cols-3 gap-6">
      <div class="col-start-2"><Button variant="outline" @click="debugData">Apply</Button></div>
    </div>
  </div>
</template>
<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
@import '../../assets/main.css';
</style>
