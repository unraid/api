<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { Button, Label, Switch } from '@unraid/ui';
import { useDummyServerStore } from '~/_data/serverState';

import type { ServerState, ServerUpdateOsResponse } from '~/types/server';

import CheckUpdateResponseModal from '~/components/UpdateOs/CheckUpdateResponseModal.vue';
import { useServerStore } from '~/store/server';
import { useUpdateOsStore } from '~/store/updateOs';

const { t } = useI18n();
const updateOsStore = useUpdateOsStore();
const serverStore = useServerStore();
const dummyServerStore = useDummyServerStore();

// Test scenarios
const testScenarios = [
  {
    id: 'expired-ineligible',
    name: 'Expired key with ineligible update',
    description: 'License expired, update available but not eligible',
    serverState: 'EEXPIRED',
    updateResponse: {
      version: '7.1.0',
      name: 'Unraid 7.1.0',
      date: '2024-12-15',
      isNewer: true,
      isEligible: false,
      changelog: 'https://docs.unraid.net/unraid-os/release-notes/7.1.0/',
      changelogPretty:
        '## Unraid 7.1.0\n\n### New Features\n- Feature 1\n- Feature 2\n\n### Bug Fixes\n- Fix 1\n- Fix 2',
      sha256: undefined, // requires auth
    },
  },
  {
    id: 'normal-update',
    name: 'Normal update available',
    description: 'Active license with eligible update',
    serverState: 'BASIC',
    updateResponse: {
      version: '7.1.0',
      name: 'Unraid 7.1.0',
      date: '2024-12-15',
      isNewer: true,
      isEligible: true,
      changelog: 'https://docs.unraid.net/unraid-os/release-notes/7.1.0/',
      changelogPretty:
        '## Unraid 7.1.0\n\n### New Features\n- Feature 1\n- Feature 2\n\n### Bug Fixes\n- Fix 1\n- Fix 2',
      sha256: 'abc123def456789',
    },
  },
  {
    id: 'renewal-required',
    name: 'Update requires renewal',
    description: 'License expired > 1 year, update requires renewal',
    serverState: 'STARTER',
    updateResponse: {
      version: '7.1.0',
      name: 'Unraid 7.1.0',
      date: '2024-12-15',
      isNewer: true,
      isEligible: false,
      changelog: 'https://docs.unraid.net/unraid-os/release-notes/7.1.0/',
      changelogPretty:
        '## Unraid 7.1.0\n\n### New Features\n- Feature 1\n- Feature 2\n\n### Bug Fixes\n- Fix 1\n- Fix 2',
      sha256: undefined,
    },
  },
  {
    id: 'no-update',
    name: 'No update available',
    description: 'Already on latest version',
    serverState: 'BASIC',
    updateResponse: {
      version: '7.0.0',
      name: 'Unraid 7.0.0',
      date: '2024-01-15',
      isNewer: false,
      isEligible: true,
      changelog: 'https://docs.unraid.net/unraid-os/release-notes/7.0.0/',
      sha256: 'xyz789abc123',
    },
  },
  {
    id: 'trial-update',
    name: 'Trial with update',
    description: 'Trial license with update available',
    serverState: 'TRIAL',
    updateResponse: {
      version: '7.1.0',
      name: 'Unraid 7.1.0',
      date: '2024-12-15',
      isNewer: true,
      isEligible: true,
      changelog: 'https://docs.unraid.net/unraid-os/release-notes/7.1.0/',
      sha256: 'def456ghi789',
    },
  },
  {
    id: 'pro-auth-required',
    name: 'Pro license - auth required',
    description: 'Pro license but authentication required for download',
    serverState: 'PRO',
    updateResponse: {
      version: '7.1.0',
      name: 'Unraid 7.1.0',
      date: '2024-12-15',
      isNewer: true,
      isEligible: true,
      changelog: 'https://docs.unraid.net/unraid-os/release-notes/7.1.0/',
      sha256: undefined, // requires auth
    },
  },
];

// Component state
const selectedScenario = ref('normal-update');
const modalOpen = ref(false);
const ignoreRelease = ref(false);
const checkingForUpdates = ref(false);
const ignoredReleases = ref<string[]>([]);

// Apply scenario
const applyScenario = () => {
  const scenario = testScenarios.find((s) => s.id === selectedScenario.value);
  if (!scenario) return;

  // Apply server state
  dummyServerStore.selector =
    scenario.serverState === 'EEXPIRED' || scenario.serverState === 'STARTER' ? 'default' : 'default';

  // Set server state
  const currentTime = Date.now();
  const expiredTime = scenario.serverState === 'EEXPIRED' ? currentTime - 24 * 60 * 60 * 1000 : 0;
  const regExp =
    scenario.serverState === 'STARTER' ? currentTime - 400 * 24 * 60 * 60 * 1000 : undefined;

  // Apply update response
  if (scenario.serverState === 'EEXPIRED') {
    serverStore.$patch({
      expireTime: expiredTime,
      state: 'EEXPIRED' as ServerState,
      regExp: undefined,
    });
  } else if (scenario.serverState === 'STARTER') {
    serverStore.$patch({
      state: 'STARTER' as ServerState,
      regExp: regExp,
      regTy: 'Starter',
    });
  } else {
    serverStore.$patch({
      state: scenario.serverState as ServerState,
      regExp: undefined,
      expireTime: scenario.serverState === 'TRIAL' ? currentTime + 7 * 24 * 60 * 60 * 1000 : 0,
    });
  }

  serverStore.setUpdateOsResponse(scenario.updateResponse as ServerUpdateOsResponse);

  // Apply ignored releases
  if (ignoreRelease.value && scenario.updateResponse.isNewer) {
    if (!ignoredReleases.value.includes(scenario.updateResponse.version)) {
      ignoredReleases.value.push(scenario.updateResponse.version);
    }
  } else {
    ignoredReleases.value = ignoredReleases.value.filter((v) => v !== scenario.updateResponse.version);
  }
  serverStore.$patch({ updateOsIgnoredReleases: ignoredReleases.value });
};

// Watch for scenario changes
watch([selectedScenario, ignoreRelease], () => {
  applyScenario();
});

// Open modal with scenario
const openModal = () => {
  applyScenario();
  updateOsStore.checkForUpdatesLoading = checkingForUpdates.value;
  modalOpen.value = true;
  updateOsStore.setModalOpen(true);
};

// Initialize
applyScenario();

const currentScenario = computed(() => testScenarios.find((s) => s.id === selectedScenario.value));
</script>

<template>
  <div class="container mx-auto max-w-4xl p-6">
    <div class="rounded-lg bg-white p-6 shadow-lg dark:bg-zinc-900">
      <div class="mb-6">
        <h2 class="mb-2 text-2xl font-bold">Update Modal Test Page</h2>
        <p class="text-muted-foreground">
          Test various update scenarios for the CheckUpdateResponseModal component
        </p>
      </div>
      <div class="space-y-6">
        <!-- Scenario Selection -->
        <div class="space-y-4">
          <Label class="text-lg font-semibold">Select Test Scenario</Label>
          <div class="space-y-3">
            <div v-for="scenario in testScenarios" :key="scenario.id" class="flex items-start space-x-3">
              <input
                type="radio"
                :id="scenario.id"
                :value="scenario.id"
                v-model="selectedScenario"
                class="mt-1 rounded-full"
              />
              <div class="flex-1">
                <Label :for="scenario.id" class="block cursor-pointer font-medium">
                  {{ scenario.name }}
                </Label>
                <p class="text-muted-foreground mt-1 text-sm">{{ scenario.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Options -->
        <div class="space-y-4 border-t pt-4">
          <h3 class="font-semibold">Options</h3>

          <div class="flex items-center space-x-3">
            <Switch id="ignore-release" v-model:checked="ignoreRelease" />
            <Label for="ignore-release" class="cursor-pointer">Ignore this release</Label>
          </div>

          <div class="flex items-center space-x-3">
            <Switch id="checking-updates" v-model:checked="checkingForUpdates" />
            <Label for="checking-updates" class="cursor-pointer"
              >Show checking for updates loading state</Label
            >
          </div>
        </div>

        <!-- Current State Display -->
        <div class="space-y-2 border-t pt-4">
          <h3 class="font-semibold">Current Scenario Details</h3>
          <div class="space-y-1 font-mono text-sm">
            <p><span class="font-semibold">Server State:</span> {{ currentScenario?.serverState }}</p>
            <p>
              <span class="font-semibold">Version:</span> {{ currentScenario?.updateResponse.version }}
            </p>
            <p>
              <span class="font-semibold">Is Newer:</span> {{ currentScenario?.updateResponse.isNewer }}
            </p>
            <p>
              <span class="font-semibold">Is Eligible:</span>
              {{ currentScenario?.updateResponse.isEligible }}
            </p>
            <p>
              <span class="font-semibold">Has SHA256:</span>
              {{ !!currentScenario?.updateResponse.sha256 }}
            </p>
            <p>
              <span class="font-semibold">Ignored Releases:</span>
              {{ ignoredReleases.join(', ') || 'None' }}
            </p>
          </div>
        </div>

        <!-- Open Modal Button -->
        <div class="border-t pt-4">
          <Button @click="openModal" variant="primary" class="w-full"> Open Update Modal </Button>
        </div>
      </div>
    </div>

    <!-- The Modal Component -->
    <CheckUpdateResponseModal
      :open="modalOpen"
      @update:open="
        (val: boolean) => {
          modalOpen = val;
          updateOsStore.setModalOpen(val);
        }
      "
    />
  </div>
</template>
