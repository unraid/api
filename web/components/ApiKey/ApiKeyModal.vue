<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
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

import type { ApiKeyFragment } from '~/composables/gql/graphql';

import { GET_API_KEY_META } from '~/components/ApiKey/apikey.query';
import ApiKeyCreate from '~/components/ApiKey/ApiKeyCreate.vue';

const { t } = useI18n();

const props = defineProps<{ open: boolean; editingKey: ApiKeyFragment | null }>();
const emit = defineEmits(['close', 'created']);
const close = () => {
  emit('close');
};

const { result: apiKeyMetaResult } = useQuery(GET_API_KEY_META);
const possibleRoles = computed(() => apiKeyMetaResult.value?.apiKeyPossibleRoles || []);
const possiblePermissions = computed(() => apiKeyMetaResult.value?.apiKeyPossiblePermissions || []);

const apiKeyCreateRef = ref();

const handleCreated = (event: { key: string } | null) => {
  close();
  emit('created', event);
};
</script>

<template>
  <Dialog
    :open="props.open"
    @close="close"
    @update:open="
      (v) => {
        if (!v) close();
      }
    "
  >
    <DialogScrollContent class="max-w-800px">
      <DialogHeader>
        <DialogTitle>{{ props.editingKey ? t('Edit API Key') : t('Create API Key') }}</DialogTitle>
      </DialogHeader>
      <DialogDescription>
        <ApiKeyCreate
          ref="apiKeyCreateRef"
          :possible-roles="possibleRoles"
          :possible-permissions="possiblePermissions"
          :editing-key="props.editingKey"
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
            {{ props.editingKey ? 'Saving...' : 'Creating...' }}
          </span>
          <span v-else>{{ props.editingKey ? 'Save' : 'Create' }}</span>
        </Button>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>
