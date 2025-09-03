import { ref, nextTick } from 'vue';
import { defineStore } from 'pinia';

import type { ApiKeyFragment } from '~/composables/gql/graphql.js';
import type { AuthorizationFormData } from '~/utils/authorizationScopes';

import '~/store/globalPinia.js';

export const useApiKeyStore = defineStore('apiKey', () => {
  const modalVisible = ref(false);
  const editingKey = ref<ApiKeyFragment | null>(null);
  const createdKey = ref<ApiKeyFragment | null>(null);
  
  // Authorization mode state
  const isAuthorizationMode = ref(false);
  const authorizationData = ref<{
    name: string;
    description: string;
    scopes: string[];
    formData?: AuthorizationFormData;
    onAuthorize?: (apiKey: string) => void;
  } | null>(null);

  function showModal(key: ApiKeyFragment | null = null) {
    editingKey.value = key;
    // Reset authorization mode if editing
    if (key) {
      isAuthorizationMode.value = false;
      authorizationData.value = null;
    }
    // Use nextTick to ensure DOM updates are complete before showing modal
    nextTick(() => {
      modalVisible.value = true;
    });
  }

  function hideModal() {
    modalVisible.value = false;
    // Clean up state after modal closes
    nextTick(() => {
      editingKey.value = null;
      isAuthorizationMode.value = false;
      authorizationData.value = null;
    });
  }
  
  function setAuthorizationMode(
    name: string,
    description: string,
    scopes: string[],
    onAuthorize?: (apiKey: string) => void,
    formData?: AuthorizationFormData
  ) {
    isAuthorizationMode.value = true;
    authorizationData.value = {
      name,
      description,
      scopes,
      formData,
      onAuthorize,
    };
    editingKey.value = null;
  }

  function setCreatedKey(key: ApiKeyFragment | null) {
    createdKey.value = key;
  }

  function clearCreatedKey() {
    createdKey.value = null;
  }

  return {
    modalVisible,
    editingKey,
    createdKey,
    isAuthorizationMode,
    authorizationData,
    showModal,
    hideModal,
    setAuthorizationMode,
    setCreatedKey,
    clearCreatedKey,
  };
});
