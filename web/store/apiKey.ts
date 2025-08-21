import { ref } from 'vue';
import { defineStore } from 'pinia';

import type { ApiKeyFragment } from '~/composables/gql/graphql';
import type { AuthorizationFormData } from '~/composables/useApiKeyAuthorizationForm';

import '~/store/globalPinia';

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
    modalVisible.value = true;
    // Reset authorization mode if editing
    if (key) {
      isAuthorizationMode.value = false;
      authorizationData.value = null;
    }
  }

  function hideModal() {
    modalVisible.value = false;
    editingKey.value = null;
    isAuthorizationMode.value = false;
    authorizationData.value = null;
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
