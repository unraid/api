<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { watchDebounced } from '@vueuse/core';

import { BrandButton, jsonFormsAjv, jsonFormsRenderers, Label, SettingsGrid } from '@unraid/ui';
import { JsonForms } from '@jsonforms/vue';
import { useJsonFormsI18n } from '~/helpers/jsonforms-i18n';

import Auth from '~/components/Auth.standalone.vue';
// unified settings values are returned as JSON, so use a generic record type
// import type { ConnectSettingsValues } from '~/composables/gql/graphql';

import {
  getConnectSettingsForm,
  updateConnectSettings,
} from '~/components/ConnectSettings/graphql/settings.query';
import OidcDebugLogs from '~/components/ConnectSettings/OidcDebugLogs.vue';
import DownloadApiLogs from '~/components/DownloadApiLogs.standalone.vue';
import { useServerStore } from '~/store/server';

// Disable automatic attribute inheritance
defineOptions({
  inheritAttrs: false,
});

const { connectPluginInstalled } = storeToRefs(useServerStore());

/**--------------------------------------------
 *     Settings State & Form definition
 *---------------------------------------------**/

const formState = ref<Record<string, unknown>>({});
const { result, refetch } = useQuery(getConnectSettingsForm);
const settings = computed(() => {
  if (!result.value) return;
  return result.value.settings.unified;
});
watch(result, () => {
  if (!result.value) return;
  // unified values are namespaced (e.g., { api: { ... } })
  formState.value = structuredClone(result.value.settings.unified.values ?? {});
});
// Remove the computed restartRequired since we get it from the mutation response

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
const actualRestartRequired = ref(false);

const { t } = useI18n();

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

// show a toast when the update is done
onMutateSettingsDone((result) => {
  actualRestartRequired.value = result.data?.updateSettings?.restartRequired ?? false;
  globalThis.toast.success(t('connectSettings.updatedApiSettingsToast'), {
    description: actualRestartRequired.value
      ? t('connectSettings.apiRestartingToastDescription')
      : undefined,
  });
});

/**--------------------------------------------
 *     Form Config & Actions
 *---------------------------------------------**/

const jsonFormsConfig = {
  restrict: false,
  trim: false,
};

const renderers = [...jsonFormsRenderers];
const jsonFormsI18n = useJsonFormsI18n();

/** Called when the user clicks the "Apply" button */
const submitSettingsUpdate = async () => {
  console.log('[ConnectSettings] trying to update settings to', formState.value);
  await mutateSettings({ input: formState.value });
  await refetch();
};

/** Called whenever a JSONForms form control changes */
const onChange = ({ data }: { data: Record<string, unknown> }) => {
  formState.value = data;
};
</script>

<template>
  <div>
    <!-- common api-related actions -->
    <SettingsGrid>
      <template v-if="connectPluginInstalled">
        <Label>{{ t('connectSettings.accountStatusLabel') }}</Label>
        <Auth />
      </template>
      <Label>{{ t('downloadApiLogs.downloadUnraidApiLogs') }}:</Label>
      <DownloadApiLogs />
    </SettingsGrid>
    <!-- auto-generated settings form -->
    <div class="mt-6 pl-3 [&_.vertical-layout]:space-y-6">
      <JsonForms
        v-if="settings"
        :schema="settings.dataSchema"
        :uischema="settings.uiSchema"
        :renderers="renderers"
        :data="formState"
        :config="jsonFormsConfig"
        :ajv="jsonFormsAjv"
        :i18n="jsonFormsI18n"
        :readonly="isUpdating"
        @change="onChange"
      />
      <!-- OIDC Debug Logs -->
      <OidcDebugLogs />

      <!-- form submission & fallback reaction message -->
      <div class="grid-cols-settings mt-6 grid items-baseline gap-y-6">
        <div class="text-end text-sm">
          <p v-if="isUpdating">{{ t('connectSettings.applyingSettings') }}</p>
        </div>
        <div class="col-start-2 max-w-3xl space-y-4">
          <BrandButton padding="lean" size="12px" class="leading-normal" @click="submitSettingsUpdate">
            {{ t('connectSettings.apply') }}
          </BrandButton>
          <p v-if="mutateSettingsError" class="text-unraid-red-500 text-sm">
            <span aria-hidden="true">✕</span>
            {{ t('common.error') }}: {{ mutateSettingsError.message }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
