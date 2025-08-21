<script setup lang="ts">
import { ref } from 'vue';
import { useApiKeyAuthorization } from '~/composables/useApiKeyAuthorization';
import { useApiKeyAuthorizationForm } from '~/composables/useApiKeyAuthorizationForm';
import { useApiKeyStore } from '~/store/apiKey';

// Use the composables for authorization logic
const {
  authParams,
  hasValidRedirectUri,
  buildCallbackUrl,
} = useApiKeyAuthorization();

const {
  formData: authorizationFormData,
  displayAppName,
  hasPermissions,
  permissionsSummary,
} = useApiKeyAuthorizationForm();

// Use the API key store to control the global modal
const apiKeyStore = useApiKeyStore();

// Component state
const showSuccess = ref(false);
const createdApiKey = ref('');
const error = ref('');

// Open the authorization modal
const openAuthorizationModal = () => {
  // Set up authorization parameters in the store
  apiKeyStore.setAuthorizationMode(
    authParams.value.name,
    authParams.value.description || `API key for ${displayAppName.value}`,
    authParams.value.scopes,
    handleAuthorize,
    authorizationFormData.value
  );
  
  // Show the modal
  apiKeyStore.showModal();
};

// Handle authorization success
const handleAuthorize = (apiKey: string) => {
  createdApiKey.value = apiKey;
  showSuccess.value = true;
  apiKeyStore.hideModal();
  
  // If redirect URI is provided, redirect after a delay
  if (hasValidRedirectUri.value && apiKey) {
    setTimeout(() => returnToApp(), 3000);
  }
};

// Navigate back to Unraid webgui home
const navigateToWebgui = () => {
  if (typeof window !== 'undefined') {
    window.location.assign('/');
  }
};

// Handle denial
const deny = () => {
  if (hasValidRedirectUri.value) {
    try {
      const url = buildCallbackUrl(
        authParams.value.redirectUri,
        undefined,
        'access_denied',
        authParams.value.state
      );
      window.location.href = url;
    } catch {
      window.location.href = '/';
    }
  } else {
    window.location.href = '/';
  }
};

// Return to app with API key
const returnToApp = () => {
  if (!hasValidRedirectUri.value || !createdApiKey.value) return;
  
  try {
    const url = buildCallbackUrl(
      authParams.value.redirectUri,
      createdApiKey.value,
      undefined,
      authParams.value.state
    );
    window.location.href = url;
  } catch (_err) {
    error.value = 'Failed to redirect back to application';
  }
};
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <!-- Success state -->
    <div v-if="showSuccess && createdApiKey" class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div class="space-y-4">
        <div class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 class="text-lg font-medium text-green-900 dark:text-green-100 mb-2">
            API Key Created Successfully!
          </h3>
          <p class="text-green-800 dark:text-green-200">
            The API key has been created with the approved permissions.
          </p>
        </div>

        <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
          <p class="text-sm font-medium mb-2">Your API Key:</p>
          <code class="block text-sm font-mono break-all bg-white dark:bg-gray-900 p-3 rounded border">
            {{ createdApiKey }}
          </code>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Save this key securely. It won't be shown again.
          </p>
        </div>

        <div class="flex gap-3">
          <button
            v-if="hasValidRedirectUri"
            class="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            @click="returnToApp"
          >
            Return to {{ authParams.name }}
          </button>
          <button
            class="flex-1 py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            @click="navigateToWebgui"
          >
            Return to Unraid
          </button>
        </div>
      </div>
    </div>

    <!-- Authorization form using ApiKeyCreate component -->
    <div v-else>
      <div class="mb-6 text-center">
        <h2 class="text-2xl font-bold mb-2">API Key Authorization</h2>
        <p class="text-gray-600 dark:text-gray-400">
          <strong>{{ displayAppName }}</strong> is requesting API access to your Unraid server
        </p>
      </div>

      <!-- Authorization details -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div v-if="hasPermissions" class="mb-4">
          <h3 class="text-sm font-semibold mb-2">Requested Permissions:</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ permissionsSummary }}
          </p>
        </div>
        
        <div v-else class="mb-4">
          <p class="text-sm text-amber-600 dark:text-amber-400">
            No specific permissions requested. The application may be requesting basic access.
          </p>
        </div>
        
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Click the button below to review the detailed permissions and authorize access.
        </p>
        
        <button
          class="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          @click="openAuthorizationModal"
        >
          Review Permissions & Authorize
        </button>
      </div>

      <div class="mt-4 text-center">
        <button
          class="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          @click="deny"
        >
          Cancel and return
        </button>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <p class="text-red-800 dark:text-red-200">{{ error }}</p>
    </div>
  </div>
</template>
