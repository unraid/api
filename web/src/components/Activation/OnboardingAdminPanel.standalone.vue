<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useApolloClient } from '@vue/apollo-composable';

import { parse } from 'graphql';

import { DEFAULT_ACTIVATION_STEPS, isEnoKeyFile } from '~/components/Activation/onboardingTestOverrides';
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

const { activationCode, isFreshInstall, partnerInfo, regState } = storeToRefs(activationCodeStore);
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

const hasActivationCode = computed(() => Boolean(activationCode.value?.code));
const regStateLabel = computed(() => (regState.value ? String(regState.value) : 'unknown'));
const activationConditionMet = computed(() => hasActivationCode.value && isEnoKeyFile(regState.value));
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
  <section class="onboarding-admin-panel">
    <div class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Onboarding State</p>
          <h2>Onboarding Wizard</h2>
          <p class="subtext">Review the current onboarding state and reset progress if needed.</p>
        </div>
        <button
          class="btn danger"
          type="button"
          :disabled="resetStatus === 'loading'"
          @click="resetOnboarding"
        >
          {{ resetStatus === 'loading' ? 'Resetting...' : 'Reset Onboarding' }}
        </button>
      </div>

      <p v-if="resetStatus === 'success'" class="status success">Reset complete.</p>
      <p v-else-if="resetStatus === 'error'" class="status error">
        Reset failed: {{ resetError ?? 'unknown error' }}
      </p>

      <div class="state-grid">
        <div class="state-card">
          <h3>Current State</h3>
          <dl>
            <div>
              <dt>Reg state</dt>
              <dd>{{ regStateLabel }}</dd>
            </div>
            <div>
              <dt>Activation code</dt>
              <dd>{{ hasActivationCode ? 'Present' : 'None' }}</dd>
            </div>
            <div>
              <dt>Activation eligible</dt>
              <dd>{{ activationConditionMet ? 'Yes' : 'No' }}</dd>
            </div>
            <div>
              <dt>Fresh install</dt>
              <dd>{{ isFreshInstall ? 'Yes' : 'No' }}</dd>
            </div>
            <div>
              <dt>Initial setup</dt>
              <dd>{{ isInitialSetup ? 'Yes' : 'No' }}</dd>
            </div>
            <div>
              <dt>Upgrade flow</dt>
              <dd>{{ isUpgrade ? 'Yes' : 'No' }}</dd>
            </div>
            <div>
              <dt>Current version</dt>
              <dd>{{ currentVersion ?? 'unknown' }}</dd>
            </div>
            <div>
              <dt>Previous version</dt>
              <dd>{{ previousVersion ?? 'n/a' }}</dd>
            </div>
            <div>
              <dt>Pending steps</dt>
              <dd>{{ upgradeSteps.length }}</dd>
            </div>
            <div>
              <dt>Partner</dt>
              <dd>{{ partnerInfo?.partnerName ?? 'none' }}</dd>
            </div>
          </dl>
        </div>

        <div class="state-card">
          <h3>Modal Gates</h3>
          <dl>
            <div>
              <dt>Activation modal visible</dt>
              <dd>{{ activationModalShouldShow ? 'Yes' : 'No' }}</dd>
            </div>
            <div>
              <dt>Hidden flag</dt>
              <dd>{{ isHidden === null ? 'unset' : isHidden ? 'true' : 'false' }}</dd>
            </div>
            <div>
              <dt>Fresh install gate</dt>
              <dd>{{ isFreshInstall ? 'Pass' : 'Block' }}</dd>
            </div>
            <div>
              <dt>Callback data</dt>
              <dd>{{ callbackData ? 'Present' : 'None' }}</dd>
            </div>
            <div>
              <dt>Upgrade pending</dt>
              <dd>{{ shouldShowUpgradeOnboarding ? 'Yes' : 'No' }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div class="state-card table-card">
        <h3>Step Diagnostics</h3>
        <table>
          <thead>
            <tr>
              <th>Step</th>
              <th>Included</th>
              <th>Required</th>
              <th>Completed</th>
              <th>Condition</th>
              <th>Condition Met</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="step in stepDiagnostics" :key="step.id">
              <td>{{ step.id }}</td>
              <td>{{ step.included ? 'Yes' : 'No' }}</td>
              <td>{{ step.required ? 'Yes' : 'No' }}</td>
              <td>{{ step.completed ? 'Yes' : 'No' }}</td>
              <td>{{ step.condition }}</td>
              <td>{{ step.conditionMet ? 'Yes' : 'No' }}</td>
            </tr>
          </tbody>
        </table>
        <p class="hint">
          Steps are supplied by the API. If a step is not included, its condition was not satisfied on
          the server.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.onboarding-admin-panel {
  margin: 24px auto;
  max-width: 1200px;
}

.panel {
  border-radius: 12px;
  border: 1px solid var(--border, rgba(148, 163, 184, 0.4));
  background: var(--card, var(--background-color, #fff));
  padding: 20px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.panel-header h2 {
  margin: 0;
  font-size: 22px;
}

.eyebrow {
  margin: 0 0 6px;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--text-muted, #64748b);
}

.subtext {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--text-muted, #64748b);
}

.status {
  margin: 8px 0 16px;
  font-size: 12px;
  font-weight: 600;
}

.status.success {
  color: #0f766e;
}

.status.error {
  color: #b91c1c;
}

.state-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.state-card {
  border-radius: 10px;
  border: 1px solid var(--border, rgba(148, 163, 184, 0.4));
  background: var(--background, #fff);
  padding: 16px;
}

.state-card h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
}

.state-card dl {
  display: grid;
  gap: 8px;
  margin: 0;
}

.state-card dl div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}

.state-card dt {
  font-weight: 600;
  color: var(--text-muted, #475569);
}

.state-card dd {
  margin: 0;
  text-align: right;
}

.table-card table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.table-card th,
.table-card td {
  padding: 8px 6px;
  border-bottom: 1px solid var(--border, rgba(148, 163, 184, 0.3));
  text-align: left;
}

.table-card th {
  color: var(--text-muted, #475569);
  font-weight: 600;
}

.hint {
  margin-top: 8px;
  font-size: 11px;
  color: var(--text-muted, #64748b);
}

.btn {
  border: 0;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.btn.danger {
  background: #b91c1c;
  color: #fff;
  box-shadow: 0 6px 14px rgba(185, 28, 28, 0.25);
}

.btn:active {
  transform: translateY(1px);
}

@media (max-width: 900px) {
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .state-grid {
    grid-template-columns: 1fr;
  }
}
</style>
