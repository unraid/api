<script setup lang="ts">
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useActivationCodeModalStore } from '~/components/Activation/store/activationCodeModal';

const activationModalStore = useActivationCodeModalStore();
const { isVisible } = storeToRefs(activationModalStore);

const refreshStatus = () => {
  // Force a reactivity update by reading the store
  void isVisible.value;
};

const showWelcomeModal = () => {
  window.location.pathname = '/welcome';
};

const showActivationModal = () => {
  activationModalStore.setIsHidden(false);
  refreshStatus();
  // Force reload to show the modal
  setTimeout(() => window.location.reload(), 100);
};

const hideActivationModal = () => {
  activationModalStore.setIsHidden(true);
  refreshStatus();
};

const clearModalStates = () => {
  activationModalStore.setIsHidden(null);
  refreshStatus();
};

const navigateToSetPassword = () => {
  window.location.href = '/Settings/ManagementAccess';
};

const navigateToRegistration = () => {
  window.location.href = '/Tools/Registration';
};

onMounted(() => {
  refreshStatus();
});
</script>

<template>
  <div class="p-8 max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-8">Modal Test Development Tool</h1>
    
    <div class="bg-surface rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Current Status</h2>
      <div class="space-y-2">
        <p><strong>Activation Modal Visible:</strong> {{ isVisible }}</p>
        <p><strong>Current Behavior:</strong> {{ isVisible ? 'Modal is showing' : 'Modal is hidden' }}</p>
      </div>
      <button 
        class="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-600"
        @click="refreshStatus"
      >
        Refresh Status
      </button>
    </div>

    <div class="bg-surface rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Modal Controls</h2>
      <div class="space-y-4">
        <div>
          <h3 class="font-semibold mb-2">Welcome Modal</h3>
          <button 
            class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            @click="showWelcomeModal"
          >
            Show Welcome Modal
          </button>
          <p class="text-sm text-muted mt-1">Navigates to /welcome page</p>
        </div>
        
        <div>
          <h3 class="font-semibold mb-2">Activation Modal</h3>
          <div class="space-x-2">
            <button 
              class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              @click="showActivationModal"
            >
              Show Activation Modal
            </button>
            <button 
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              @click="hideActivationModal"
            >
              Hide Activation Modal
            </button>
          </div>
        </div>
        
        <div>
          <h3 class="font-semibold mb-2">Reset</h3>
          <button 
            class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            @click="clearModalStates"
          >
            Clear All Modal States
          </button>
          <p class="text-sm text-muted mt-1">Resets to default behavior</p>
        </div>
      </div>
    </div>

    <div class="bg-surface rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">SessionStorage Commands</h2>
      <p class="text-sm text-muted mb-4">Use these commands in the browser console to directly manipulate modal state:</p>
      <div class="space-y-2">
        <div class="font-mono text-sm bg-black text-green-400 p-3 rounded">
          <p># Show activation modal (force show)</p>
          <p>sessionStorage.setItem('activationCodeModalHidden', 'false')</p>
        </div>
        <div class="font-mono text-sm bg-black text-green-400 p-3 rounded">
          <p># Hide activation modal</p>
          <p>sessionStorage.setItem('activationCodeModalHidden', 'true')</p>
        </div>
        <div class="font-mono text-sm bg-black text-green-400 p-3 rounded">
          <p># Clear state (default behavior)</p>
          <p>sessionStorage.removeItem('activationCodeModalHidden')</p>
        </div>
      </div>
    </div>

    <div class="bg-surface rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-4">Navigation</h2>
      <div class="space-x-2">
        <button 
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          @click="navigateToSetPassword"
        >
          Go to Set Password Page
        </button>
        <button 
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          @click="navigateToRegistration"
        >
          Go to Registration Page
        </button>
      </div>
    </div>

    <div class="mt-8 p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
      <h3 class="font-semibold text-yellow-800 dark:text-yellow-200">Developer Notes:</h3>
      <ul class="list-disc list-inside mt-2 text-sm text-yellow-700 dark:text-yellow-300">
        <li>The Welcome Modal appears on the /welcome page and during set-password flow</li>
        <li>The Activation Modal visibility depends on:
          <ul class="list-disc list-inside ml-4">
            <li>SessionStorage 'activationCodeModalHidden' = 'false' (force show) OR</li>
            <li>Fresh install + No callback data + Not explicitly hidden</li>
          </ul>
        </li>
        <li>"Show Activation Modal" sets sessionStorage to force show and reloads</li>
        <li>"Clear All Modal States" resets to default behavior (show on fresh install)</li>
        <li>The modal is rendered globally via Modals.ce.vue web component</li>
      </ul>
    </div>
  </div>
</template>
