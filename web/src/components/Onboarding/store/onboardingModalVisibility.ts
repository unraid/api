import { computed, onMounted, onUnmounted, ref } from 'vue';
import { defineStore, storeToRefs } from 'pinia';
import { useMutation } from '@vue/apollo-composable';

import { CLOSE_ONBOARDING_MUTATION } from '~/components/Onboarding/graphql/closeOnboarding.mutation';
import { OPEN_ONBOARDING_MUTATION } from '~/components/Onboarding/graphql/openOnboarding.mutation';
import { RESUME_ONBOARDING_MUTATION } from '~/components/Onboarding/graphql/resumeOnboarding.mutation';
import { useOnboardingStore } from '~/components/Onboarding/store/onboardingStatus';
import { clearLegacyOnboardingModalHiddenSessionState } from '~/components/Onboarding/store/onboardingStorageCleanup';
import { useCallbackActionsStore } from '~/store/callbackActions';

const ONBOARDING_QUERY_ACTION_PARAM = 'onboarding';
const ONBOARDING_URL_ACTION_RESUME = 'resume';
const ONBOARDING_URL_ACTION_OPEN = 'open';
const ONBOARDING_FORCE_OPEN_EVENT = 'unraid:onboarding:open';

export type OnboardingModalSessionSource = 'automatic' | 'manual';

export const useOnboardingModalStore = defineStore('onboardingModalVisibility', () => {
  const onboardingStore = useOnboardingStore();
  const { shouldOpen, canDisplayOnboardingModal } = storeToRefs(onboardingStore);
  const { refetchOnboarding } = onboardingStore;
  const { callbackData } = storeToRefs(useCallbackActionsStore());
  const { mutate: openOnboardingMutation } = useMutation(OPEN_ONBOARDING_MUTATION);
  const { mutate: closeOnboardingMutation } = useMutation(CLOSE_ONBOARDING_MUTATION);
  const { mutate: resumeOnboardingMutation } = useMutation(RESUME_ONBOARDING_MUTATION);
  const sessionSource = ref<OnboardingModalSessionSource>('automatic');

  const isVisible = computed(
    () => canDisplayOnboardingModal.value && shouldOpen.value && !callbackData.value
  );

  const forceOpenModal = async () => {
    if (!canDisplayOnboardingModal.value) {
      return false;
    }

    sessionSource.value = 'manual';
    await openOnboardingMutation();
    await refetchOnboarding();
    return true;
  };

  const closeModal = async () => {
    if (!canDisplayOnboardingModal.value) {
      return false;
    }

    await closeOnboardingMutation();
    await refetchOnboarding();
    sessionSource.value = 'automatic';
    return true;
  };

  const resetToAutomaticVisibility = async () => closeModal();

  const resumeOnboarding = async () => {
    sessionSource.value = 'manual';
    await resumeOnboardingMutation();
    await refetchOnboarding();
  };

  const applyOnboardingUrlAction = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    const action = url.searchParams.get(ONBOARDING_QUERY_ACTION_PARAM);

    if (action === ONBOARDING_URL_ACTION_RESUME) {
      await resumeOnboarding();
    } else if (action === ONBOARDING_URL_ACTION_OPEN) {
      await forceOpenModal();
    } else {
      return;
    }

    url.searchParams.delete(ONBOARDING_QUERY_ACTION_PARAM);
    const nextPath = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state ?? null, '', nextPath || '/');
  };

  const handleForceOpen = () => {
    void forceOpenModal();
  };

  onMounted(() => {
    clearLegacyOnboardingModalHiddenSessionState();
    void applyOnboardingUrlAction();
    window?.addEventListener(ONBOARDING_FORCE_OPEN_EVENT, handleForceOpen);
  });

  onUnmounted(() => {
    window?.removeEventListener(ONBOARDING_FORCE_OPEN_EVENT, handleForceOpen);
  });

  return {
    isVisible,
    sessionSource,
    forceOpenModal,
    closeModal,
    resumeOnboarding,
    resetToAutomaticVisibility,
    applyOnboardingUrlAction,
  };
});
