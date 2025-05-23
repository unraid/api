import { createPinia, defineStore, setActivePinia } from 'pinia';
import { useToggle } from '@vueuse/core';
import type { ApiKeyFragment } from '~/composables/gql/graphql';
import { ref } from 'vue';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useModalStore = defineStore('modal', () => {
  const [modalVisible, modalToggle] = useToggle(true);
  const apiKeyModalVisible = ref(false);
  const apiKeyModalEditingKey = ref<ApiKeyFragment | null>(null);
  const apiKeyModalCreatedKey = ref<{ id: string; key: string } | null>(null);

  const modalHide = () => {
    modalVisible.value = false;
  };
  const modalShow = () => {
    modalVisible.value = true;
  };

  function showApiKeyModal(editingKey: ApiKeyFragment | null = null) {
    apiKeyModalEditingKey.value = editingKey;
    apiKeyModalVisible.value = true;
  }
  function hideApiKeyModal() {
    apiKeyModalVisible.value = false;
    apiKeyModalEditingKey.value = null;
  }
  function setApiKeyModalCreatedKey(key: { id: string; key: string } | null) {
    apiKeyModalCreatedKey.value = key;
  }

  return {
    modalVisible,
    modalHide,
    modalShow,
    modalToggle,
    apiKeyModalVisible,
    apiKeyModalEditingKey,
    apiKeyModalCreatedKey,
    showApiKeyModal,
    hideApiKeyModal,
    setApiKeyModalCreatedKey,
  };
});
