<script lang="ts" setup>
// import { useI18n } from 'vue-i18n';

// const { t } = useI18n();

import { useMutation, useQuery } from '@vue/apollo-composable';

import { BrandButton, Label } from '@unraid/ui';
import { JsonForms } from '@jsonforms/vue';
import { vanillaRenderers } from '@jsonforms/vue-vanilla';

import type { ConnectSettingsValues } from '~/composables/gql/graphql';

import {
  formSelectEntry,
  formSwitchEntry,
  numberFieldEntry,
  preconditionsLabelEntry,
  stringArrayEntry,
} from '../GeneratedForm/renderer-entries';
import { getConnectSettingsForm, updateConnectSettings } from './graphql/settings.query';

/**--------------------------------------------
 *     Settings State & Form definition
 *---------------------------------------------**/

const formState = ref<Partial<ConnectSettingsValues>>({});
const { result } = useQuery(getConnectSettingsForm);
const settings = computed(() => {
  if (!result.value) return;
  return result.value?.connect.settings;
});
watch(result, () => {
  if (!result.value) return;
  const { __typename, ...initialValues } = result.value.connect.settings.values;
  console.log('[ConnectSettings] current settings', initialValues);
  formState.value = initialValues;
});

/**--------------------------------------------
 *     Update Settings Actions
 *---------------------------------------------**/

const {
  mutate: mutateSettings,
  loading: mutateSettingsLoading,
  error: mutateSettingsError,
  onDone: onMutateSettingsDone,
} = useMutation(updateConnectSettings);

const isUpdating = ref(false);
const reactionMessage = ref('');

// prevent ui flash if loading finishes too fast
watchDebounced(
  mutateSettingsLoading,
  (loading) => {
    isUpdating.value = loading;
  },
  {
    debounce: 100,
  }
);

// show a toast when the update is done, or fallback to a reaction message (eg in dev environment)
onMutateSettingsDone(() => {
  globalThis.toast?.success('Updated API Settings');
  if (!globalThis.toast) {
    reactionMessage.value = 'Updated API Settings <span class="text-green-500">✓</span>';
    setTimeout(() => {
      reactionMessage.value = '';
    }, 3000);
  }
});

/**--------------------------------------------
 *     Form Config & Actions
 *---------------------------------------------**/

const jsonFormsConfig = {
  restrict: false,
  trim: false,
};

/** JSONForms renderers */
const renderers = [
  ...vanillaRenderers,
  formSwitchEntry,
  formSelectEntry,
  numberFieldEntry,
  preconditionsLabelEntry,
  // verticalLayoutEntry,
  stringArrayEntry,
];

/** Called when the user clicks the "Apply" button */
const submitSettingsUpdate = async () => {
  console.log('[ConnectSettings] trying to update settings to', formState.value);
  await mutateSettings({ input: formState.value });
};

/** Called whenever a JSONForms form control changes */
const onChange = ({ data }: { data: Record<string, unknown> }) => {
  formState.value = data;
};
</script>

<template>
  <!-- common api-related actions -->
  <div
    class="grid grid-cols-settings items-baseline pl-3 gap-y-6 [&>*:nth-child(odd)]:text-end [&>*:nth-child(even)]:ml-10"
  >
    <Label>Account Status:</Label>
    <div v-html="'<unraid-i18n-host><unraid-auth></unraid-auth></unraid-i18n-host>'"></div>
    <Label>Download Unraid API Logs:</Label>
    <div
      v-html="
        '<unraid-i18n-host><unraid-download-api-logs></unraid-download-api-logs></unraid-i18n-host>'
      "
    ></div>
  </div>
  <!-- auto-generated settings form -->
  <div class="mt-6 pl-3 [&_.vertical-layout]:space-y-6">
    <JsonForms
      v-if="settings"
      :schema="settings.dataSchema"
      :uischema="settings.uiSchema"
      :renderers="renderers"
      :data="formState"
      :config="jsonFormsConfig"
      :readonly="isUpdating"
      @change="onChange"
    />
    <!-- form submission & fallback reaction message -->
    <div class="mt-6 grid grid-cols-settings gap-y-6 items-baseline">
      <div class="text-sm text-end">
        <p v-if="isUpdating">Applying Settings...</p>
        <p v-if="reactionMessage" v-html="reactionMessage"></p>
      </div>
      <div class="col-start-2 ml-10 space-y-4">
        <BrandButton
          variant="outline-primary"
          padding="lean"
          size="12px"
          class="leading-normal"
          @click="submitSettingsUpdate"
        >
          Apply
        </BrandButton>

        <p v-if="mutateSettingsError" class="text-sm text-unraid-red-500">
          ✕ Error: {{ mutateSettingsError.message }}
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
