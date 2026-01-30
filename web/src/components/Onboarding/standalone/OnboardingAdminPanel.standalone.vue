<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useApolloClient } from '@vue/apollo-composable';

import { InformationCircleIcon } from '@heroicons/vue/24/outline';
import { parse } from 'graphql';

import { useActivationCodeDataStore } from '~/components/Onboarding/store/activationCodeData';
import { useActivationCodeModalStore } from '~/components/Onboarding/store/activationCodeModal';
import { useOnboardingStore } from '~/components/Onboarding/store/upgradeOnboarding';
import { RegistrationState } from '~/composables/gql/graphql';

const activationModalStore = useActivationCodeModalStore();
const onboardingStore = useOnboardingStore();
const activationCodeStore = useActivationCodeDataStore();

const apolloClient = useApolloClient().client;

const { hasActivationCode, isFreshInstall, partnerInfo, registrationState } =
  storeToRefs(activationCodeStore);
const { status, isPartnerBuild, completed, completedAtVersion } = storeToRefs(onboardingStore);

const draftJson = ref('');
const errorMessage = ref('');
const lastApplied = ref('');
const activePresetId = ref<string | null>(null);

const SET_ONBOARDING_OVERRIDE_MUTATION = parse(/* GraphQL */ `
  mutation SetOnboardingOverride($input: OnboardingOverrideInput!) {
    onboarding {
      setOnboardingOverride(input: $input) {
        status
        isPartnerBuild
        completed
        completedAtVersion
      }
    }
  }
`);

const CLEAR_ONBOARDING_OVERRIDE_MUTATION = parse(/* GraphQL */ `
  mutation ClearOnboardingOverride {
    onboarding {
      clearOnboardingOverride {
        status
        isPartnerBuild
        completed
        completedAtVersion
      }
    }
  }
`);

type OnboardingOverridePayload = {
  onboarding?: {
    completed?: boolean;
    completedAtVersion?: string | null;
  };
  activationCode?: {
    code?: string;
    partnerName?: string;
    partnerUrl?: string;
    serverName?: string;
    sysModel?: string;
    theme?: 'azure' | 'black' | 'gray' | 'white';
    // New link fields
    hardwareSpecsUrl?: string;
    manualUrl?: string;
    supportUrl?: string;
    extraLinks?: Array<{ title: string; url: string }>;
  } | null;
  partnerInfo?: {
    hasPartnerLogo?: boolean | null;
    partnerName?: string | null;
    partnerUrl?: string | null;
    partnerLogoUrl?: string | null;
    // New link fields
    hardwareSpecsUrl?: string | null;
    manualUrl?: string | null;
    supportUrl?: string | null;
    extraLinks?: Array<{ title: string; url: string }> | null;
  } | null;
  registrationState?: RegistrationState;
};

type Preset = {
  id: string;
  label: string;
  description: string;
  overrides: OnboardingOverridePayload;
};

// Made reactive to allow adding new presets in session
const presets = ref<Preset[]>([
  // ============ REGULAR USER STATES ============
  {
    id: 'regular-incomplete',
    label: '1. Regular User - Incomplete',
    description: 'Fresh install, no partner, onboarding not completed',
    overrides: {
      registrationState: RegistrationState.ENOKEYFILE,
      onboarding: {
        completed: false,
        completedAtVersion: null,
      },
      activationCode: null,
      partnerInfo: null,
    },
  },
  {
    id: 'regular-upgrade',
    label: '2. Regular User - Upgrade',
    description: 'Completed onboarding on older version (7.1.0), now on 7.2.0',
    overrides: {
      registrationState: RegistrationState.EGUID,
      onboarding: {
        completed: true,
        completedAtVersion: '7.1.0', // Older than current version
      },
      activationCode: null,
      partnerInfo: null,
    },
  },
  {
    id: 'regular-completed',
    label: '3. Regular User - Completed',
    description: 'Onboarding already completed on current version',
    overrides: {
      registrationState: RegistrationState.EGUID,
      onboarding: {
        completed: true,
        completedAtVersion: '7.2.0', // Same as current version
      },
      activationCode: null,
      partnerInfo: null,
    },
  },

  // ============ PARTNER USER STATES (e.g., 45Drives) ============
  {
    id: 'partner-incomplete',
    label: '4. Partner User - Incomplete',
    description: 'Partner install with activation code, onboarding not completed',
    overrides: {
      registrationState: RegistrationState.ENOKEYFILE,
      onboarding: {
        completed: false,
        completedAtVersion: null,
      },
      activationCode: {
        code: 'DEMO-PARTNER-CODE-123',
        partnerName: '45Drives',
        partnerUrl: 'https://45drives.com',
        serverName: 'Storinator S45',
        sysModel: 'Storinator',
        theme: 'azure',
        hardwareSpecsUrl: 'https://45drives.com/specs/storinator-s45',
        manualUrl: 'https://45drives.com/docs/storinator-manual',
        supportUrl: 'https://45drives.com/support',
        extraLinks: [
          { title: 'Community Forums', url: 'https://45drives.com/forums' },
          { title: 'Knowledge Base', url: 'https://45drives.com/kb' },
        ],
      },
      partnerInfo: {
        hasPartnerLogo: true,
        partnerName: '45Drives',
        partnerUrl: 'https://45drives.com',
        partnerLogoUrl: '/config/activate/45drives-logo.png',
        hardwareSpecsUrl: 'https://45drives.com/specs/storinator-s45',
        manualUrl: 'https://45drives.com/docs/storinator-manual',
        supportUrl: 'https://45drives.com/support',
        extraLinks: [
          { title: 'Community Forums', url: 'https://45drives.com/forums' },
          { title: 'Knowledge Base', url: 'https://45drives.com/kb' },
        ],
      },
    },
  },
  {
    id: 'partner-upgrade',
    label: '5. Partner User - Upgrade',
    description: 'Partner user completed on older version, now upgraded',
    overrides: {
      registrationState: RegistrationState.EGUID,
      onboarding: {
        completed: true,
        completedAtVersion: '7.1.0',
      },
      activationCode: {
        code: 'DEMO-PARTNER-CODE-456',
        partnerName: '45Drives',
        partnerUrl: 'https://45drives.com',
        serverName: 'Storinator AV15',
        sysModel: 'Storinator',
        theme: 'azure',
        hardwareSpecsUrl: 'https://45drives.com/specs/storinator-av15',
        manualUrl: 'https://45drives.com/docs/storinator-manual',
        supportUrl: 'https://45drives.com/support',
      },
      partnerInfo: {
        hasPartnerLogo: true,
        partnerName: '45Drives',
        partnerUrl: 'https://45drives.com',
        partnerLogoUrl: '/config/activate/45drives-logo.png',
        hardwareSpecsUrl: 'https://45drives.com/specs/storinator-av15',
        manualUrl: 'https://45drives.com/docs/storinator-manual',
        supportUrl: 'https://45drives.com/support',
      },
    },
  },
  {
    id: 'partner-completed',
    label: '6. Partner User - Completed',
    description: 'Partner user already completed onboarding',
    overrides: {
      registrationState: RegistrationState.EGUID,
      onboarding: {
        completed: true,
        completedAtVersion: '7.2.0',
      },
      activationCode: {
        code: 'DEMO-PARTNER-CODE-789',
        partnerName: '45Drives',
        partnerUrl: 'https://45drives.com',
        serverName: 'Storinator Q30',
        sysModel: 'Storinator',
        theme: 'azure',
      },
      partnerInfo: {
        hasPartnerLogo: true,
        partnerName: '45Drives',
        partnerUrl: 'https://45drives.com',
        partnerLogoUrl: '/config/activate/45drives-logo.png',
      },
    },
  },
]);

const formattedOverrides = (value: OnboardingOverridePayload | null) => {
  if (!value) return '';
  return JSON.stringify(value, null, 2);
};

// "Load" the preset into the editor (for editing) - and set as active selection
const loadPreset = (preset: Preset) => {
  draftJson.value = formattedOverrides(preset.overrides);
  errorMessage.value = '';
  activePresetId.value = preset.id;
};

// Apply preset directly - Acts as "Activate"
const applyAndOpenPreset = async (preset: Preset) => {
  activePresetId.value = preset.id;
  draftJson.value = formattedOverrides(preset.overrides);
  errorMessage.value = '';
  await applyOverrides();
  // Force open modal
  setTimeout(() => activationModalStore.setIsHidden(false), 100);
};

const clearOverrides = async () => {
  await apolloClient.mutate({
    mutation: CLEAR_ONBOARDING_OVERRIDE_MUTATION,
    fetchPolicy: 'no-cache',
  });
  lastApplied.value = '';
  activePresetId.value = null; // Clear active state
  await apolloClient.refetchQueries({
    include: ['ActivationCode', 'PublicWelcomeData', 'Onboarding'],
  });
};

const applyOverrides = async () => {
  const trimmed = draftJson.value.trim();
  if (!trimmed) {
    await clearOverrides();
    errorMessage.value = '';
    return;
  }

  try {
    const parsed = JSON.parse(trimmed) as OnboardingOverridePayload;
    await apolloClient.mutate({
      mutation: SET_ONBOARDING_OVERRIDE_MUTATION,
      variables: { input: parsed },
      fetchPolicy: 'no-cache',
    });
    lastApplied.value = trimmed;
    await apolloClient.refetchQueries({
      include: ['ActivationCode', 'PublicWelcomeData', 'Onboarding'],
    });
    errorMessage.value = '';

    // Auto-open modal if configuration suggests it should be open
    if (!parsed.onboarding?.completed) {
      setTimeout(() => activationModalStore.setIsHidden(false), 100);
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? `Invalid JSON: ${error.message}` : 'Invalid JSON payload';
  }
};

const createPresetFromCurrent = () => {
  const trimmed = draftJson.value.trim();
  if (!trimmed) {
    errorMessage.value = 'Cannot create preset from empty configuration';
    return;
  }

  try {
    const parsed = JSON.parse(trimmed) as OnboardingOverridePayload;
    const newPreset: Preset = {
      id: `custom-${Date.now()}`,
      label: `Custom Preset ${presets.value.length + 1}`,
      description: 'Created from current editor state',
      overrides: parsed,
    };
    presets.value.push(newPreset);
    activePresetId.value = newPreset.id;

    // Log to console for version control tracing
    console.info('New Preset Created. Copy the object below to add to source code:', newPreset);
    alert('Preset added to list! Check browser console to copy the JSON for version control.');
  } catch (error) {
    errorMessage.value = 'Invalid JSON, cannot create preset.';
  }
};

// Helper to get status badge color
const getStatusBadgeClass = (statusValue: string | undefined) => {
  switch (statusValue) {
    case 'COMPLETED':
      return 'bg-green-500/15 text-green-600 dark:text-green-400';
    case 'INCOMPLETE':
      return 'bg-orange-500/15 text-orange-600 dark:text-orange-400';
    case 'UPGRADE':
      return 'bg-purple-500/15 text-purple-600 dark:text-purple-400';
    default:
      return 'bg-gray-500/15 text-gray-600 dark:text-gray-400';
  }
};
</script>

<template>
  <div
    class="bg-background text-foreground flex h-full max-h-screen flex-col gap-6 overflow-auto p-6 pb-8"
  >
    <!-- Current State Panel -->
    <div class="border-border bg-card shrink-0 rounded-lg border p-5 shadow-sm">
      <div class="mb-4">
        <div class="mb-2 flex items-center justify-between">
          <div class="flex gap-2">
            <span
              :class="getStatusBadgeClass(status)"
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              >Status: {{ status || 'Loading...' }}</span
            >
            <span
              v-if="isPartnerBuild"
              class="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400"
              >Partner Build</span
            >
          </div>
        </div>
        <h2 class="text-muted-foreground text-xs font-bold tracking-wider uppercase">Current State</h2>
      </div>

      <div class="grid grid-cols-1 gap-6 text-sm md:grid-cols-4">
        <!-- Onboarding Status -->
        <div class="space-y-1">
          <h3 class="border-border text-foreground mb-2 border-b pb-1 text-xs font-semibold uppercase">
            Onboarding
          </h3>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Status:</span>
            <span class="font-mono text-xs font-bold">{{ status || 'N/A' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Completed:</span>
            <span class="font-mono text-xs">{{ completed }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Completed At:</span>
            <span class="font-mono text-xs">{{ completedAtVersion || '-' }}</span>
          </div>
        </div>

        <!-- Registration -->
        <div class="space-y-1">
          <h3 class="border-border text-foreground mb-2 border-b pb-1 text-xs font-semibold uppercase">
            Configuration Context
          </h3>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Fresh Install:</span>
            <span
              class="font-mono text-xs"
              :class="
                isFreshInstall
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-blue-600 dark:text-blue-400'
              "
              >{{ isFreshInstall }}</span
            >
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Reg State:</span>
            <span class="font-mono text-xs">{{ registrationState || 'N/A' }}</span>
          </div>
        </div>

        <!-- Partner -->
        <div class="space-y-1">
          <h3 class="border-border text-foreground mb-2 border-b pb-1 text-xs font-semibold uppercase">
            Partner Data
          </h3>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Is Partner Build:</span>
            <span class="font-mono text-xs">{{ isPartnerBuild }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Has Activation Code:</span>
            <span class="font-mono text-xs">{{ hasActivationCode }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Partner:</span>
            <span class="font-mono text-xs">{{ partnerInfo?.partnerName || '-' }}</span>
          </div>
        </div>

        <!-- System -->
        <div class="space-y-1">
          <h3 class="border-border text-foreground mb-2 border-b pb-1 text-xs font-semibold uppercase">
            System
          </h3>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Logo:</span>
            <span class="font-mono text-xs">{{
              partnerInfo?.hasPartnerLogo ? 'Custom' : 'Default'
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls Area -->
    <div class="grid h-[400px] min-h-[400px] grid-cols-1 gap-6 lg:grid-cols-12">
      <!-- Presets List (Left) -->
      <div class="border-border bg-card flex min-h-0 flex-col rounded-lg border shadow-sm lg:col-span-4">
        <div class="border-border bg-muted flex items-center justify-between rounded-t-lg border-b p-3">
          <h3 class="text-sm font-semibold">Quick Presets</h3>
          <div class="flex items-center gap-2">
            <button
              @click="activationModalStore.setIsHidden(false)"
              class="border-primary bg-primary/10 text-primary hover:bg-primary/20 rounded border px-2 py-0.5 text-xs font-medium"
            >
              Open Onboarding Modal
            </button>
            <button
              @click="createPresetFromCurrent"
              class="text-primary hover:text-primary/80 text-xs font-medium hover:underline"
              title="Create from current editor JSON"
            >
              + Add Custom
            </button>
          </div>
        </div>

        <div class="flex-1 space-y-2 overflow-y-auto p-3">
          <div
            v-for="preset in presets"
            :key="preset.id"
            class="group hover:bg-muted flex flex-col gap-2 rounded border p-3 transition-colors"
            :class="
              activePresetId === preset.id
                ? 'border-primary bg-primary/5 ring-primary ring-1'
                : 'border-border'
            "
            @click="loadPreset(preset)"
          >
            <div>
              <div class="text-foreground text-sm font-medium">{{ preset.label }}</div>
              <div class="text-muted-foreground text-xs">{{ preset.description }}</div>
            </div>
            <div class="mt-1 flex gap-2">
              <button
                @click.stop="applyAndOpenPreset(preset)"
                class="bg-primary text-primary-foreground flex-1 rounded px-2 py-1 text-xs font-medium shadow-sm hover:opacity-90"
              >
                Open
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- JSON Editor (Right) -->
      <div class="border-border bg-card flex min-h-0 flex-col rounded-lg border shadow-sm lg:col-span-8">
        <div class="border-border bg-muted flex items-center justify-between rounded-t-lg border-b p-3">
          <h3 class="text-sm font-semibold">Overrides JSON</h3>
          <div class="flex gap-2">
            <button
              @click="clearOverrides"
              class="rounded border border-transparent px-3 py-1 text-xs font-medium text-red-600 hover:border-red-200 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Clear
            </button>
            <button
              @click="applyOverrides"
              class="bg-primary text-primary-foreground rounded px-3 py-1 text-xs font-medium shadow-sm transition-opacity hover:opacity-90"
            >
              Apply Changes
            </button>
          </div>
        </div>

        <div class="relative flex-1">
          <textarea
            v-model="draftJson"
            class="absolute inset-0 h-full w-full resize-none bg-black p-4 font-mono text-xs text-gray-300 focus:outline-none"
            placeholder="// Paste overrides JSON here..."
          />
        </div>

        <div
          v-if="errorMessage"
          class="border-t border-red-500/20 bg-red-500/10 p-2 font-mono text-xs break-all text-red-600 dark:text-red-400"
        >
          {{ errorMessage }}
        </div>
        <div
          v-else-if="lastApplied"
          class="flex items-center justify-between border-t border-green-500/20 bg-green-500/10 p-2 text-xs text-green-600 dark:text-green-400"
        >
          <span>✓ Configuration applied</span>
          <span class="text-xs opacity-75">Modified just now</span>
        </div>
      </div>
    </div>

    <!-- Data Source Reference Section -->
    <div class="border-border bg-elevated mt-4 shrink-0 rounded-lg border p-4">
      <div class="mb-4 flex items-center gap-2">
        <InformationCircleIcon class="text-muted-foreground h-5 w-5" />
        <h3 class="text-sm font-semibold">Data Source Reference</h3>
      </div>
      <p class="text-muted-foreground mb-4 text-xs">
        This table shows where each override field originates from on a real Unraid system.
      </p>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-border border-b">
              <th class="text-muted-foreground py-2 pr-4 font-medium">Override Field</th>
              <th class="text-muted-foreground py-2 pr-4 font-medium">Original Source</th>
              <th class="text-muted-foreground py-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody class="divide-border divide-y">
            <tr>
              <td class="py-2 pr-4 font-mono text-orange-500">registrationState</td>
              <td class="py-2 pr-4">
                <code class="bg-muted rounded px-1">/var/local/emhttp/var.ini</code>
              </td>
              <td class="text-muted-foreground py-2">
                Read from <code>regCheck</code> or <code>regTy</code> field
              </td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono text-blue-500">onboarding.completed</td>
              <td class="py-2 pr-4">
                <code class="bg-muted rounded px-1">onboarding-tracker.json</code>
              </td>
              <td class="text-muted-foreground py-2">Stored in flash config directory</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono text-blue-500">onboarding.completedAtVersion</td>
              <td class="py-2 pr-4">
                <code class="bg-muted rounded px-1">onboarding-tracker.json</code>
              </td>
              <td class="text-muted-foreground py-2">Used to detect upgrades</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono text-green-500">activationCode.*</td>
              <td class="py-2 pr-4">
                <code class="bg-muted rounded px-1">/boot/config/activate/*.activationcode</code>
              </td>
              <td class="text-muted-foreground py-2">Partner/OEM activation JSON file</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono text-green-500">activationCode.code</td>
              <td class="py-2 pr-4">
                <code class="bg-muted rounded px-1">*.activationcode → code</code>
              </td>
              <td class="text-muted-foreground py-2">
                Unique activation code string (exposed as <code>onboarding.activationCode</code>)
              </td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono text-cyan-500">hardwareSpecsUrl</td>
              <td class="py-2 pr-4">
                <code class="bg-muted rounded px-1">*.activationcode</code>
              </td>
              <td class="text-muted-foreground py-2">Link to hardware specifications (optional)</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono text-cyan-500">manualUrl</td>
              <td class="py-2 pr-4">
                <code class="bg-muted rounded px-1">*.activationcode</code>
              </td>
              <td class="text-muted-foreground py-2">Link to system manual (optional)</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono text-cyan-500">supportUrl</td>
              <td class="py-2 pr-4">
                <code class="bg-muted rounded px-1">*.activationcode</code>
              </td>
              <td class="text-muted-foreground py-2">Link to support page (optional)</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono text-cyan-500">extraLinks[]</td>
              <td class="py-2 pr-4">
                <code class="bg-muted rounded px-1">*.activationcode</code>
              </td>
              <td class="text-muted-foreground py-2">
                Array of {title, url} for custom partner links (optional)
              </td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono text-purple-500">partnerInfo.*</td>
              <td class="py-2 pr-4">
                <span class="italic">Computed</span>
              </td>
              <td class="text-muted-foreground py-2">
                Derived from activation code + logo file presence
              </td>
            </tr>
            <tr class="bg-muted/30">
              <td class="py-2 pr-4 font-mono text-gray-400">status</td>
              <td class="py-2 pr-4">
                <span class="italic">Computed by API</span>
              </td>
              <td class="text-muted-foreground py-2">
                INCOMPLETE | UPGRADE | COMPLETED (based on tracker + current version)
              </td>
            </tr>
            <tr class="bg-muted/30">
              <td class="py-2 pr-4 font-mono text-gray-400">isPartnerBuild</td>
              <td class="py-2 pr-4">
                <span class="italic">Computed by API</span>
              </td>
              <td class="text-muted-foreground py-2">true if activation code exists</td>
            </tr>
            <tr class="bg-muted/30">
              <td class="py-2 pr-4 font-mono text-gray-400">currentVersion</td>
              <td class="py-2 pr-4">
                <code class="bg-muted rounded px-1">/etc/unraid-version</code>
              </td>
              <td class="text-muted-foreground py-2">
                Available via <code>info.versions.core.unraid</code> query
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="border-border text-muted-foreground mt-4 border-t pt-3 text-xs">
        <strong class="text-foreground">Tip:</strong> Fields in
        <span class="text-gray-400">gray</span> are computed and cannot be directly overridden. The
        override system mocks the source data, and the API computes derived fields from it.
      </div>
    </div>
  </div>
</template>
