import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { VueWrapper } from '@vue/test-utils';
import type { Pinia } from 'pinia';

import Modals from '~/components/Modals.standalone.vue';
import { useCallbackActionsStore } from '~/store/callbackActions';
import { useTrialStore } from '~/store/trial';
import { useUpdateOsStore } from '~/store/updateOs';

// Mock child components
vi.mock('~/components/Onboarding/OnboardingModal.vue', () => ({
  default: {
    name: 'OnboardingModal',
    props: [],
    template: '<div>OnboardingModal</div>',
  },
}));

vi.mock('~/components/UpdateOs/ChangelogModal.vue', () => ({
  default: {
    name: 'UpdateOsChangelogModal',
    props: ['open'],
    template: '<div v-if="open">ChangelogModal</div>',
  },
}));

vi.mock('~/components/UpdateOs/CheckUpdateResponseModal.vue', () => ({
  default: {
    name: 'UpdateOsCheckUpdateResponseModal',
    props: ['open'],
    template: '<div v-if="open">CheckUpdateResponseModal</div>',
  },
}));

vi.mock('~/components/UserProfile/CallbackFeedback.vue', () => ({
  default: {
    name: 'UpcCallbackFeedback',
    props: ['open'],
    template: '<div v-if="open">CallbackFeedback</div>',
  },
}));

vi.mock('~/components/UserProfile/Trial.vue', () => ({
  default: {
    name: 'UpcTrial',
    props: ['open'],
    template: '<div v-if="open">Trial</div>',
  },
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('Modals.standalone.vue', () => {
  let wrapper: VueWrapper;
  let pinia: Pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);

    wrapper = mount(Modals, {
      global: {
        plugins: [pinia],
      },
    });
  });

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
  });

  it('should render modals container with correct id and ref', () => {
    const modalsDiv = wrapper.find('#modals');
    expect(modalsDiv.exists()).toBe(true);
    expect(modalsDiv.attributes('class')).toContain('relative');
    expect(modalsDiv.attributes('class')).toContain('z-[999999]');
  });

  it('should render all modal components', () => {
    expect(wrapper.findComponent({ name: 'UpcCallbackFeedback' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'UpcTrial' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'UpdateOsCheckUpdateResponseModal' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'UpdateOsChangelogModal' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'OnboardingModal' }).exists()).toBe(true);
  });

  it('should pass correct props to CallbackFeedback based on store state', async () => {
    const callbackStore = useCallbackActionsStore();
    callbackStore.callbackStatus = 'loading';

    await nextTick();

    const callbackFeedback = wrapper.findComponent({ name: 'UpcCallbackFeedback' });
    expect(callbackFeedback.props('open')).toBe(true);

    callbackStore.callbackStatus = 'ready';
    await nextTick();
    expect(callbackFeedback.props('open')).toBe(false);
  });

  it('should pass correct props to Trial modal based on store state', async () => {
    const trialStore = useTrialStore();
    // trialModalVisible is computed based on trialStatus
    trialStore.trialStatus = 'trialStart';

    await nextTick();

    const trialModal = wrapper.findComponent({ name: 'UpcTrial' });
    expect(trialModal.props('open')).toBe(true);

    trialStore.trialStatus = 'ready';
    await nextTick();
    expect(trialModal.props('open')).toBe(false);
  });

  it('should pass correct props to UpdateOs modal based on store state', async () => {
    const updateOsStore = useUpdateOsStore();
    updateOsStore.setModalOpen(true);

    await nextTick();

    const updateOsModal = wrapper.findComponent({ name: 'UpdateOsCheckUpdateResponseModal' });
    expect(updateOsModal.props('open')).toBe(true);

    updateOsStore.setModalOpen(false);
    await nextTick();
    expect(updateOsModal.props('open')).toBe(false);
  });

  it('should pass correct props to Changelog modal based on store state', async () => {
    const updateOsStore = useUpdateOsStore();
    // changelogModalVisible is computed based on releaseForUpdate
    updateOsStore.setReleaseForUpdate({
      version: '6.13.0',
      name: 'Unraid 6.13.0',
      date: '2024-01-01',
      isNewer: true,
      isEligible: true,
      changelog: null,
      sha256: null,
    });

    await nextTick();

    const changelogModal = wrapper.findComponent({ name: 'UpdateOsChangelogModal' });
    expect(changelogModal.props('open')).toBe(true);

    updateOsStore.setReleaseForUpdate(null);
    await nextTick();
    expect(changelogModal.props('open')).toBe(false);
  });

  it('should render all modal components without t props (using useI18n)', () => {
    const components = [
      'UpcCallbackFeedback',
      'UpcTrial',
      'UpdateOsCheckUpdateResponseModal',
      'UpdateOsChangelogModal',
    ];

    components.forEach((componentName) => {
      const component = wrapper.findComponent({ name: componentName });
      expect(component.exists()).toBe(true);
      // Components now use useI18n internally, so no t prop should be passed
      expect(component.props('t')).toBeUndefined();
    });
  });

  it('should use computed properties for reactive store access', async () => {
    // Test that computed properties react to store changes
    const callbackStore = useCallbackActionsStore();
    const trialStore = useTrialStore();
    const updateOsStore = useUpdateOsStore();

    // Initially all should be closed/default
    expect(wrapper.findComponent({ name: 'UpcCallbackFeedback' }).props('open')).toBe(false);
    expect(wrapper.findComponent({ name: 'UpcTrial' }).props('open')).toBe(false);
    expect(wrapper.findComponent({ name: 'UpdateOsCheckUpdateResponseModal' }).props('open')).toBe(
      false
    );
    expect(wrapper.findComponent({ name: 'UpdateOsChangelogModal' }).props('open')).toBe(false);

    // Update all stores using proper methods
    callbackStore.callbackStatus = 'loading';
    trialStore.trialStatus = 'trialStart';
    updateOsStore.setModalOpen(true);
    updateOsStore.setReleaseForUpdate({
      version: '6.13.0',
      name: 'Unraid 6.13.0',
      date: '2024-01-01',
      isNewer: true,
      isEligible: true,
      changelog: null,
      sha256: null,
    });

    await nextTick();

    // All should be open now
    expect(wrapper.findComponent({ name: 'UpcCallbackFeedback' }).props('open')).toBe(true);
    expect(wrapper.findComponent({ name: 'UpcTrial' }).props('open')).toBe(true);
    expect(wrapper.findComponent({ name: 'UpdateOsCheckUpdateResponseModal' }).props('open')).toBe(true);
    expect(wrapper.findComponent({ name: 'UpdateOsChangelogModal' }).props('open')).toBe(true);
  });

  it('should render modals container even when all modals are closed', () => {
    const callbackStore = useCallbackActionsStore();
    const trialStore = useTrialStore();
    const updateOsStore = useUpdateOsStore();

    // Set all modals to closed state
    callbackStore.callbackStatus = 'ready';
    trialStore.trialStatus = 'ready';
    updateOsStore.setModalOpen(false);
    updateOsStore.setReleaseForUpdate(null);

    const modalsDiv = wrapper.find('#modals');
    expect(modalsDiv.exists()).toBe(true);
    // Container should still exist
    expect(wrapper.findComponent({ name: 'OnboardingModal' }).exists()).toBe(true);
  });
});
