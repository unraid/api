<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';

import type { OnboardingTestOverrides } from '~/components/Activation/onboardingTestOverrides';

import {
  DEFAULT_ACTIVATION_STEPS,
  isEnoKeyFile,
  useOnboardingTestOverrides,
} from '~/components/Activation/onboardingTestOverrides';
import { useActivationCodeDataStore } from '~/components/Activation/store/activationCodeData';
import { useActivationCodeModalStore } from '~/components/Activation/store/activationCodeModal';
import { useUpgradeOnboardingStore } from '~/components/Activation/store/upgradeOnboarding';
import { useWelcomeModalDataStore } from '~/components/Activation/store/welcomeModalData';
import { ActivationOnboardingStepId, RegistrationState } from '~/composables/gql/graphql';
import { useCallbackActionsStore } from '~/store/callbackActions';

const { enabled, overrides, setEnabled, setOverrides, clearOverrides } = useOnboardingTestOverrides();
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

const draftJson = ref('');
const selectedPreset = ref('');
const errorMessage = ref('');

const cloneSteps = () => DEFAULT_ACTIVATION_STEPS.map((step) => ({ ...step }));

const presets: Array<{ id: string; label: string; overrides: OnboardingTestOverrides }> = [
  {
    id: 'fresh-install-activation',
    label: 'Fresh install (activation code)',
    overrides: {
      regState: RegistrationState.ENOKEYFILE,
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
      regState: RegistrationState.ENOKEYFILE,
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

const formattedOverrides = (value: OnboardingTestOverrides | null) => {
  if (!value) return '';
  return JSON.stringify(value, null, 2);
};

const loadDraftFromOverrides = () => {
  draftJson.value = formattedOverrides(overrides.value);
  errorMessage.value = '';
};

const applyOverrides = () => {
  const trimmed = draftJson.value.trim();
  if (!trimmed) {
    clearOverrides();
    errorMessage.value = '';
    return;
  }

  try {
    const parsed = JSON.parse(trimmed) as OnboardingTestOverrides;
    setOverrides(parsed);
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

const statusLabel = computed(() => (enabled.value ? 'Enabled' : 'Disabled'));
const overrideLabel = computed(() => (overrides.value ? 'Overrides loaded' : 'No overrides'));
const hasActivationCode = computed(() => Boolean(activationCode.value?.code));
const regStateLabel = computed(() => (regState.value ? String(regState.value) : 'unknown'));
const activationConditionMet = computed(() => hasActivationCode.value && isEnoKeyFile(regState.value));
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

onMounted(() => {
  loadDraftFromOverrides();
});
</script>

<template>
  <section class="onboarding-test-harness">
    <div class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Onboarding State</p>
          <h2>Activation + Upgrade Debug Controls</h2>
        </div>
        <label class="toggle">
          <input type="checkbox" :checked="enabled" @change="setEnabled(!enabled)" />
          <span>Overrides {{ statusLabel }}</span>
        </label>
      </div>

      <div class="status-row">
        <span class="status-pill">{{ overrideLabel }}</span>
        <span class="status-pill">Overrides active on onboarding debug pages</span>
      </div>

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
          <h3>Modal Visibility</h3>
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
            <div>
              <dt>Welcome auto-show</dt>
              <dd>{{ welcomeModalAuto ? 'Yes' : 'No' }}</dd>
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
          the server side.
        </p>
      </div>

      <div class="panel-grid">
        <div class="editor">
          <label class="field-label" for="onboarding-override-json">Overrides (JSON)</label>
          <textarea id="onboarding-override-json" v-model="draftJson" rows="18" spellcheck="false" />
          <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
          <div class="button-row">
            <button class="btn primary" type="button" @click="applyOverrides">Apply Overrides</button>
            <button class="btn ghost" type="button" @click="loadDraftFromOverrides">Reload</button>
            <button class="btn danger" type="button" @click="clearOverrides">Clear Overrides</button>
          </div>
        </div>

        <div class="sidebar">
          <div class="section">
            <label class="field-label" for="onboarding-preset">Presets</label>
            <select id="onboarding-preset" v-model="selectedPreset">
              <option value="">Select a preset</option>
              <option v-for="preset in presets" :key="preset.id" :value="preset.id">
                {{ preset.label }}
              </option>
            </select>
            <button class="btn secondary" type="button" @click="applyPreset">Load preset</button>
          </div>

          <div class="section">
            <p class="field-label">Modal Actions</p>
            <div class="button-stack">
              <button class="btn primary" type="button" @click="showActivationModal">
                Show Activation Modal
              </button>
              <button class="btn ghost" type="button" @click="resetActivationModal">
                Reset Activation Modal
              </button>
              <button class="btn secondary" type="button" @click="hideActivationModal">
                Hide Activation Modal
              </button>
              <button class="btn primary" type="button" @click="showWelcomeModal">
                Show Welcome Modal
              </button>
              <button class="btn secondary" type="button" @click="hideWelcomeModal">
                Hide Welcome Modal
              </button>
            </div>
          </div>

          <div class="section">
            <p class="field-label">Data Actions</p>
            <button class="btn ghost" type="button" @click="refetchOnboarding">
              Refetch Onboarding Query
            </button>
          </div>

          <div class="section note">
            <p>
              Overrides are applied client-side and stored in localStorage on onboarding debug pages.
              Clear overrides to return to server data.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.onboarding-test-harness {
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
  align-items: center;
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

.toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
}

.status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.status-pill {
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
  background: rgba(15, 23, 42, 0.08);
  color: var(--text-color, #0f172a);
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

.panel-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(240px, 1fr);
  gap: 20px;
}

.editor textarea {
  width: 100%;
  min-height: 360px;
  border-radius: 10px;
  border: 1px solid var(--border, rgba(148, 163, 184, 0.4));
  padding: 12px;
  background: var(--background, #fff);
  color: var(--text-color, #0f172a);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: 12px;
}

.field-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted, #475569);
}

.error {
  margin: 8px 0 0;
  color: #b91c1c;
  font-size: 12px;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.button-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

.btn.primary {
  background: #2563eb;
  color: #fff;
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.25);
}

.btn.secondary {
  background: #0f172a;
  color: #e2e8f0;
}

.btn.ghost {
  background: transparent;
  border: 1px solid var(--border, rgba(148, 163, 184, 0.5));
  color: var(--text-color, #0f172a);
}

.btn.danger {
  background: #b91c1c;
  color: #fff;
}

.btn:active {
  transform: translateY(1px);
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section select {
  border-radius: 8px;
  border: 1px solid var(--border, rgba(148, 163, 184, 0.4));
  padding: 8px 10px;
  font-size: 12px;
  background: var(--background, #fff);
  color: var(--text-color, #0f172a);
}

.note {
  font-size: 11px;
  color: var(--text-muted, #64748b);
  line-height: 1.5;
}

@media (max-width: 900px) {
  .state-grid {
    grid-template-columns: 1fr;
  }

  .panel-grid {
    grid-template-columns: 1fr;
  }
}
</style>
