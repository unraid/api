<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ComposerTranslation } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import {
  Button,
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from '@unraid/ui';

import { GET_API_KEY_META } from '~/components/ApiKey/apikey.query';
import ApiKeyCreate from '~/components/ApiKey/ApiKeyCreate.vue';
import { useModalStore } from '~/store/modal';

defineProps<{ open: boolean; t: ComposerTranslation }>();

const modalStore = useModalStore();
const { apiKeyModalEditingKey } = storeToRefs(modalStore);

const { result: apiKeyMetaResult } = useQuery(GET_API_KEY_META);
const possibleRoles = computed(() => apiKeyMetaResult.value?.apiKeyPossibleRoles || []);
const possiblePermissions = computed(() => apiKeyMetaResult.value?.apiKeyPossiblePermissions || []);

const apiKeyCreateRef = ref();

const close = () => {
  modalStore.hideApiKeyModal();
};

const handleCreated = (event: { id: string; key: string } | null) => {
  modalStore.setApiKeyModalCreatedKey(event);
  close();
};
</script>

<template>
  <Dialog
    :open="open"
    @close="close"
    @update:open="
      (v) => {
        if (!v) close();
      }
    "
  >
    <DialogScrollContent class="max-w-800px">
      <DialogHeader>
        <DialogTitle>{{ apiKeyModalEditingKey ? t('Edit API Key') : t('Create API Key') }}</DialogTitle>
      </DialogHeader>
      <DialogDescription>
        <ApiKeyCreate
          ref="apiKeyCreateRef"
          :possible-roles="possibleRoles"
          :possible-permissions="possiblePermissions"
          :editing-key="apiKeyModalEditingKey"
          @created="handleCreated"
        />
      </DialogDescription>
      <DialogFooter>
        <Button variant="secondary" @click="close">Cancel</Button>
        <Button
          variant="primary"
          :disabled="apiKeyCreateRef?.loading || apiKeyCreateRef?.postCreateLoading"
          @click="apiKeyCreateRef?.upsertKey()"
        >
          <span v-if="apiKeyCreateRef?.loading || apiKeyCreateRef?.postCreateLoading">
            {{ apiKeyModalEditingKey ? 'Saving...' : 'Creating...' }}
          </span>
          <span v-else>{{ apiKeyModalEditingKey ? 'Save' : 'Create' }}</span>
        </Button>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>
