<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useApolloClient } from '@vue/apollo-composable';

import { Button } from '@unraid/ui';
import { parse } from 'graphql';

import { DEFAULT_ACTIVATION_STEPS } from '~/components/Activation/onboardingTestDefaults';
import { useActivationCodeDataStore } from '~/components/Activation/store/activationCodeData';
import { useActivationCodeModalStore } from '~/components/Activation/store/activationCodeModal';
import { useUpgradeOnboardingStore } from '~/components/Activation/store/upgradeOnboarding';
import { useWelcomeModalDataStore } from '~/components/Activation/store/welcomeModalData';
import { ActivationOnboardingStepId, RegistrationState } from '~/composables/gql/graphql';
import { useCallbackActionsStore } from '~/store/callbackActions';

const activationModalStore = useActivationCodeModalStore();
const upgradeOnboardingStore = useUpgradeOnboardingStore();
const activationCodeStore = useActivationCodeDataStore();
const welcomeModalStore = useWelcomeModalDataStore();
const callbackStore = useCallbackActionsStore();
const apolloClient = useApolloClient().client;

const { activationRequired, hasActivationCode, isFreshInstall, partnerInfo, registrationState } =
  storeToRefs(activationCodeStore);
const { isInitialSetup } = storeToRefs(welcomeModalStore);
const { callbackData } = storeToRefs(callbackStore);
const { isHidden, isVisible } = storeToRefs(activationModalStore);
const {
  allUpgradeSteps,
  upgradeSteps,
  shouldShowUpgradeOnboarding,
  currentVersion,
  previousVersion,
  isUpgrade,
} = storeToRefs(upgradeOnboardingStore);

const draftJson = ref('');
const selectedPreset = ref('');
const errorMessage = ref('');
const lastApplied = ref('');

const SET_ONBOARDING_OVERRIDE_MUTATION = parse(/* GraphQL */ `
  mutation SetOnboardingOverride($input: OnboardingOverrideInput!) {
    onboarding {
      setOnboardingOverride(input: $input) {
        isUpgrade
        previousVersion
        currentVersion
        hasPendingSteps
        steps {
          id
          required
          completed
          introducedIn
        }
      }
    }
  }
`);

const CLEAR_ONBOARDING_OVERRIDE_MUTATION = parse(/* GraphQL */ `
  mutation ClearOnboardingOverride {
    onboarding {
      clearOnboardingOverride {
        isUpgrade
        previousVersion
        currentVersion
        hasPendingSteps
        steps {
          id
          required
          completed
          introducedIn
        }
      }
    }
  }
`);

const cloneSteps = () => DEFAULT_ACTIVATION_STEPS.map((step) => ({ ...step }));

type OnboardingOverridePayload = {
  activationOnboarding?: {
    currentVersion?: string | null;
    previousVersion?: string | null;
    isUpgrade?: boolean;
    steps?: Array<{
      id: ActivationOnboardingStepId;
      required?: boolean;
      completed?: boolean;
      introducedIn?: string;
    }>;
  };
  activationCode?: {
    code?: string;
    partnerName?: string;
    partnerUrl?: string;
    serverName?: string;
    sysModel?: string;
    comment?: string;
    header?: string;
    headermetacolor?: string;
    background?: string;
    showBannerGradient?: boolean;
    theme?: 'azure' | 'black' | 'gray' | 'white';
  } | null;
  partnerInfo?: {
    hasPartnerLogo?: boolean | null;
    partnerName?: string | null;
    partnerUrl?: string | null;
    partnerLogoUrl?: string | null;
  } | null;
  registrationState?: RegistrationState;
  isInitialSetup?: boolean;
};

const presets: Array<{ id: string; label: string; overrides: OnboardingOverridePayload }> = [
  {
    id: 'fresh-install-activation',
    label: 'Fresh install (activation code)',
    overrides: {
      registrationState: RegistrationState.ENOKEYFILE,
      activationCode: {
        code: 'TEST-CODE-123',
        partnerName: 'Test Partner',
        serverName: 'TestServer',
        sysModel: 'Test Model',
      },
      partnerInfo: {
        hasPartnerLogo: false,
        partnerName: 'Test Partner',
        partnerUrl: 'https://example.com',
        partnerLogoUrl: null,
      },
      activationOnboarding: {
        currentVersion: '7.0.0',
        isUpgrade: false,
        steps: [],
      },
    },
  },
  {
    id: 'fresh-install-no-code',
    label: 'Fresh install (no activation code)',
    overrides: {
      registrationState: RegistrationState.ENOKEYFILE,
      activationCode: null,
      partnerInfo: null,
      activationOnboarding: {
        currentVersion: '7.0.0',
        isUpgrade: false,
        steps: [],
      },
    },
  },
  {
    id: 'upgrade-all-steps',
    label: 'Upgrade onboarding (all steps pending)',
    overrides: {
      activationOnboarding: {
        currentVersion: '7.0.0',
        previousVersion: '6.12.0',
        isUpgrade: true,
        steps: cloneSteps(),
      },
    },
  },
  {
    id: 'upgrade-resume-activation',
    label: 'Upgrade onboarding (resume at activation)',
    overrides: {
      activationOnboarding: {
        currentVersion: '7.0.0',
        previousVersion: '6.12.0',
        isUpgrade: true,
        steps: cloneSteps().map((step) => ({
          ...step,
          completed: step.id !== ActivationOnboardingStepId.ACTIVATION,
        })),
      },
    },
  },
  {
    id: 'welcome-initial-setup',
    label: 'Welcome modal (initial setup)',
    overrides: {
      isInitialSetup: true,
      partnerInfo: {
        hasPartnerLogo: false,
        partnerName: 'Test Partner',
        partnerUrl: 'https://example.com',
        partnerLogoUrl: null,
      },
    },
  },
];

const formattedOverrides = (value: OnboardingOverridePayload | null) => {
  if (!value) return '';
  return JSON.stringify(value, null, 2);
};

const loadDraftFromOverrides = () => {
  draftJson.value = lastApplied.value;
  errorMessage.value = '';
};

const clearOverrides = async () => {
  await apolloClient.mutate({
    mutation: CLEAR_ONBOARDING_OVERRIDE_MUTATION,
    fetchPolicy: 'no-cache',
  });
  lastApplied.value = '';
  await apolloClient.refetchQueries({
    include: ['ActivationCode', 'PublicWelcomeData', 'ActivationOnboarding'],
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
      include: ['ActivationCode', 'PublicWelcomeData', 'ActivationOnboarding'],
    });
    errorMessage.value = '';
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? `Invalid JSON: ${error.message}` : 'Invalid JSON payload';
  }
};

const applyPreset = () => {
  const preset = presets.find((item) => item.id === selectedPreset.value);
  if (!preset) return;
  draftJson.value = formattedOverrides(preset.overrides);
  errorMessage.value = '';
};

const showActivationModal = () => {
  activationModalStore.setIsHidden(false);
};

const hideActivationModal = () => {
  activationModalStore.setIsHidden(true);
};

const resetActivationModal = () => {
  activationModalStore.setIsHidden(null);
};

const showWelcomeModal = () => {
  window.dispatchEvent(new CustomEvent('unraid:onboarding-test:show-welcome'));
};

const hideWelcomeModal = () => {
  window.dispatchEvent(new CustomEvent('unraid:onboarding-test:hide-welcome'));
};

const refetchOnboarding = async () => {
  await upgradeOnboardingStore.refetchActivationOnboarding();
};

const regStateLabel = computed(() =>
  registrationState.value ? String(registrationState.value) : 'unknown'
);
const activationConditionMet = computed(() => activationRequired.value);
const activationModalShouldShow = computed(() => isVisible.value || shouldShowUpgradeOnboarding.value);
const isLoginPage = computed(() => {
  if (typeof window === 'undefined') return false;
  return window.location?.pathname?.includes('login') ?? false;
});
const welcomeModalAuto = computed(() => isInitialSetup.value || isLoginPage.value);

const stepDiagnostics = computed(() => {
  const byId = new Map(allUpgradeSteps.value.map((step) => [step.id, step]));
  return DEFAULT_ACTIVATION_STEPS.map((definition) => {
    const serverStep = byId.get(definition.id);
    const isActivationStep = definition.id === ActivationOnboardingStepId.ACTIVATION;
    const condition = isActivationStep ? 'activation code + ENOKEYFILE regState' : 'always';
    const conditionMet = isActivationStep ? activationConditionMet.value : true;
    return {
      id: definition.id,
      included: Boolean(serverStep),
      required: serverStep?.required ?? definition.required,
      completed: serverStep?.completed ?? false,
      introducedIn: serverStep?.introducedIn ?? definition.introducedIn ?? 'unknown',
      condition,
      conditionMet,
    };
  });
});

const stepColumns = [
  { accessorKey: 'step', header: 'Step' },
  { accessorKey: 'included', header: 'Included' },
  { accessorKey: 'required', header: 'Required' },
  { accessorKey: 'completed', header: 'Completed' },
  { accessorKey: 'condition', header: 'Condition' },
  { accessorKey: 'conditionMet', header: 'Condition Met' },
];

const stepRows = computed(() =>
  stepDiagnostics.value.map((step) => ({
    step: step.id,
    included: step.included ? 'Yes' : 'No',
    required: step.required ? 'Yes' : 'No',
    completed: step.completed ? 'Yes' : 'No',
    condition: step.condition,
    conditionMet: step.conditionMet ? 'Yes' : 'No',
  }))
);

onMounted(() => {
  loadDraftFromOverrides();
});
</script>

<template>
  <section class="mx-auto max-w-6xl space-y-6">
    <UCard>
      <template #header>
        <div>
          <p class="text-muted-foreground text-xs tracking-[0.2em] uppercase">Onboarding State</p>
          <h2 class="text-lg font-semibold">Activation + Upgrade Debug Controls</h2>
        </div>
      </template>

      <UAlert
        color="neutral"
        variant="soft"
        title="Server-side overrides"
        description="Overrides are applied in the API and reset on restart. Use Clear Overrides to reload live state."
      />
    </UCard>

    <div class="grid gap-6 lg:grid-cols-2">
      <UCard>
        <template #header>
          <div class="font-medium">Current State</div>
        </template>
        <dl class="space-y-2 text-sm">
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted-foreground">Registration state</dt>
            <dd class="font-medium">{{ regStateLabel }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted-foreground">Activation code</dt>
            <dd class="font-medium">{{ hasActivationCode ? 'Present' : 'None' }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted-foreground">Fresh install</dt>
            <dd class="font-medium">{{ isFreshInstall ? 'Yes' : 'No' }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted-foreground">Initial setup</dt>
            <dd class="font-medium">{{ isInitialSetup ? 'Yes' : 'No' }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted-foreground">Upgrade flow</dt>
            <dd class="font-medium">{{ isUpgrade ? 'Yes' : 'No' }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted-foreground">Current version</dt>
            <dd class="font-medium">{{ currentVersion ?? 'unknown' }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted-foreground">Previous version</dt>
            <dd class="font-medium">{{ previousVersion ?? 'n/a' }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted-foreground">Pending steps</dt>
            <dd class="font-medium">{{ upgradeSteps.length }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted-foreground">Partner</dt>
            <dd class="font-medium">{{ partnerInfo?.partnerName ?? 'none' }}</dd>
          </div>
        </dl>
      </UCard>

      <UCard>
        <template #header>
          <div class="font-medium">Modal Visibility</div>
        </template>
        <dl class="space-y-2 text-sm">
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted-foreground">Activation modal visible</dt>
            <dd class="font-medium">{{ activationModalShouldShow ? 'Yes' : 'No' }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted-foreground">Hidden flag</dt>
            <dd class="font-medium">
              {{ isHidden === null ? 'unset' : isHidden ? 'true' : 'false' }}
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted-foreground">Fresh install gate</dt>
            <dd class="font-medium">{{ isFreshInstall ? 'Pass' : 'Block' }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted-foreground">Callback data</dt>
            <dd class="font-medium">{{ callbackData ? 'Present' : 'None' }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted-foreground">Upgrade pending</dt>
            <dd class="font-medium">{{ shouldShowUpgradeOnboarding ? 'Yes' : 'No' }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted-foreground">Welcome auto-show</dt>
            <dd class="font-medium">{{ welcomeModalAuto ? 'Yes' : 'No' }}</dd>
          </div>
        </dl>
      </UCard>
    </div>

    <UCard>
      <template #header>
        <div class="font-medium">Step Diagnostics</div>
      </template>
      <UTable
        :data="stepRows"
        :columns="stepColumns"
        sticky="header"
        :ui="{ td: 'py-2 px-3', th: 'py-2 px-3 text-left text-muted-foreground' }"
      >
        <template #empty>
          <div class="text-muted-foreground py-6 text-center text-sm">No steps available.</div>
        </template>
      </UTable>
      <template #footer>
        <p class="text-muted-foreground text-xs">
          Steps are supplied by the API. If a step is not included, its condition was not satisfied on
          the server side.
        </p>
      </template>
    </UCard>

    <div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <UCard>
        <template #header>
          <div class="font-medium">Overrides</div>
        </template>
        <UFormField label="Overrides (JSON)">
          <UTextarea
            v-model="draftJson"
            :rows="18"
            spellcheck="false"
            :ui="{ base: 'font-mono text-xs' }"
          />
        </UFormField>
        <UAlert
          v-if="errorMessage"
          color="error"
          variant="soft"
          title="Invalid overrides"
          :description="errorMessage"
          icon="i-lucide-alert-circle"
          class="mt-4"
        />
        <div class="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" size="sm" @click="applyOverrides">Apply Overrides</Button>
          <Button variant="outline" size="sm" @click="loadDraftFromOverrides"> Reload </Button>
          <Button variant="destructive" size="sm" @click="clearOverrides"> Clear Overrides </Button>
        </div>
      </UCard>

      <div class="space-y-6">
        <UCard>
          <template #header>
            <div class="font-medium">Presets</div>
          </template>
          <UFormField label="Preset">
            <USelectMenu
              v-model="selectedPreset"
              :items="presets"
              label-key="label"
              value-key="id"
              placeholder="Select a preset"
            />
          </UFormField>
          <Button variant="outline" size="sm" class="mt-3" @click="applyPreset"> Load preset </Button>
        </UCard>

        <UCard>
          <template #header>
            <div class="font-medium">Modal Actions</div>
          </template>
          <div class="flex flex-col gap-2">
            <Button variant="primary" size="sm" @click="showActivationModal">
              Show Activation Modal
            </Button>
            <Button variant="outline" size="sm" @click="resetActivationModal">
              Reset Activation Modal
            </Button>
            <Button variant="outline" size="sm" @click="hideActivationModal">
              Hide Activation Modal
            </Button>
            <Button variant="primary" size="sm" @click="showWelcomeModal"> Show Welcome Modal </Button>
            <Button variant="outline" size="sm" @click="hideWelcomeModal"> Hide Welcome Modal </Button>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="font-medium">Data Actions</div>
          </template>
          <Button variant="outline" size="sm" @click="refetchOnboarding">
            Refetch Onboarding Query
          </Button>
        </UCard>

        <UAlert
          color="neutral"
          variant="soft"
          title="Overrides live in the API"
          description="Overrides are in-memory only and cleared on API restart. Clear overrides to return to disk-backed state."
        />
      </div>
    </div>
  </section>
</template>
