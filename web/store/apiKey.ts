import { ref } from 'vue';
import { defineStore } from 'pinia';

import type { ApiKeyFragment, ApiKeyWithKeyFragment } from '~/composables/gql/graphql';

import '~/store/globalPinia';

export const useApiKeyStore = defineStore('apiKey', () => {
  const modalVisible = ref(false);
  const editingKey = ref<ApiKeyFragment | null>(null);
  const createdKey = ref<ApiKeyWithKeyFragment | null>(null);

  function showModal(key: ApiKeyFragment | null = null) {
    editingKey.value = key;
    modalVisible.value = true;
  }

  function hideModal() {
    modalVisible.value = false;
    editingKey.value = null;
  }

  function setCreatedKey(key: ApiKeyWithKeyFragment | null) {
    createdKey.value = key;
  }

  function clearCreatedKey() {
    createdKey.value = null;
  }

  return {
    modalVisible,
    editingKey,
    createdKey,
    showModal,
    hideModal,
    setCreatedKey,
    clearCreatedKey,
  };
});
