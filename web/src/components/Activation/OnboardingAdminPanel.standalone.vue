<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useApolloClient } from '@vue/apollo-composable';

import { parse } from 'graphql';

import { DEFAULT_ACTIVATION_STEPS } from '~/components/Activation/onboardingTestDefaults';
import { useActivationCodeDataStore } from '~/components/Activation/store/activationCodeData';
import { useActivationCodeModalStore } from '~/components/Activation/store/activationCodeModal';
import { useUpgradeOnboardingStore } from '~/components/Activation/store/upgradeOnboarding';
import { useWelcomeModalDataStore } from '~/components/Activation/store/welcomeModalData';
import { ActivationOnboardingStepId } from '~/composables/gql/graphql';
import { useCallbackActionsStore } from '~/store/callbackActions';

const activationModalStore = useActivationCodeModalStore();
const upgradeOnboardingStore = useUpgradeOnboardingStore();
const activationCodeStore = useActivationCodeDataStore();
const welcomeModalStore = useWelcomeModalDataStore();
const callbackStore = useCallbackActionsStore();

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

const { refetchActivationOnboarding } = upgradeOnboardingStore;
const apolloClient = useApolloClient().client;

const RESET_UPGRADE_ONBOARDING_MUTATION = parse(/* GraphQL */ `
  mutation ResetUpgradeOnboarding {
    onboarding {
      resetUpgradeOnboarding {
        isUpgrade
        previousVersion
        currentVersion
        completedSteps
        steps {
          id
          required
          introducedIn
        }
      }
    }
  }
`);

const resetStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle');
const resetError = ref<string | null>(null);

const regStateLabel = computed(() =>
  registrationState.value ? String(registrationState.value) : 'unknown'
);
const activationConditionMet = computed(() => activationRequired.value);
const activationModalShouldShow = computed(() => isVisible.value || shouldShowUpgradeOnboarding.value);

const stepDiagnostics = computed(() => {
  const byId = new Map(allUpgradeSteps.value.map((step) => [step.id, step]));
  const base = DEFAULT_ACTIVATION_STEPS.map((definition) => {
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

  const extra = allUpgradeSteps.value
    .filter((step) => !DEFAULT_ACTIVATION_STEPS.some((definition) => definition.id === step.id))
    .map((step) => ({
      id: step.id,
      included: true,
      required: step.required,
      completed: step.completed,
      introducedIn: step.introducedIn ?? 'unknown',
      condition: 'server supplied',
      conditionMet: true,
    }));

  return [...base, ...extra];
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

const resetOnboarding = async () => {
  if (resetStatus.value === 'loading') return;
  if (typeof window === 'undefined') return;
  const confirmed = window.confirm(
    'Reset onboarding progress for this system? This will clear completed steps.'
  );
  if (!confirmed) return;

  resetStatus.value = 'loading';
  resetError.value = null;

  try {
    await apolloClient.mutate({
      mutation: RESET_UPGRADE_ONBOARDING_MUTATION,
      fetchPolicy: 'no-cache',
    });
    await refetchActivationOnboarding();
    resetStatus.value = 'success';
  } catch (error) {
    resetStatus.value = 'error';
    resetError.value = error instanceof Error ? error.message : 'Reset failed';
  }
};
</script>

<template>
  <section class="mx-auto max-w-6xl space-y-6">
    <UCard>
      <template #header>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-muted-foreground text-xs tracking-[0.2em] uppercase">Onboarding State</p>
            <h2 class="text-lg font-semibold">Onboarding Wizard</h2>
            <p class="text-muted-foreground text-sm">
              Review the current onboarding state and reset progress if needed.
            </p>
          </div>
          <UButton
            color="error"
            variant="solid"
            size="sm"
            :loading="resetStatus === 'loading'"
            @click="resetOnboarding"
          >
            Reset Onboarding
          </UButton>
        </div>
      </template>

      <UAlert
        v-if="resetStatus === 'success'"
        color="success"
        variant="soft"
        title="Reset complete"
        icon="i-lucide-check-circle-2"
        class="mb-4"
      />
      <UAlert
        v-else-if="resetStatus === 'error'"
        color="error"
        variant="soft"
        title="Reset failed"
        :description="resetError ?? 'unknown error'"
        icon="i-lucide-alert-circle"
        class="mb-4"
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
            <dt class="text-muted-foreground">Activation eligible</dt>
            <dd class="font-medium">{{ activationConditionMet ? 'Yes' : 'No' }}</dd>
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
          <div class="font-medium">Modal Gates</div>
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
          the server.
        </p>
      </template>
    </UCard>
  </section>
</template>
