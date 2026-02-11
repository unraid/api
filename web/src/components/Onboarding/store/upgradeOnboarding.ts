import { computed } from 'vue';
import { defineStore, storeToRefs } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

import { ONBOARDING_QUERY } from '@/components/Onboarding/graphql/activationOnboarding.query';

import type { OnboardingStatus } from '~/composables/gql/graphql';

import { useServerStore } from '~/store/server';

const MIN_ONBOARDING_MAJOR = 7;
const MIN_ONBOARDING_MINOR = 3;

const parseMajorMinorVersion = (version: string | null | undefined) => {
  const match = version?.match(/(\d+)\.(\d+)/);
  if (!match) {
    return null;
  }

  return {
    major: Number.parseInt(match[1] ?? '0', 10),
    minor: Number.parseInt(match[2] ?? '0', 10),
  };
};

const isUnauthenticatedApolloError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const apolloError = error as {
    message?: string;
    graphQLErrors?: Array<{
      message?: string;
      extensions?: {
        code?: string;
        originalError?: { statusCode?: number; message?: string };
      };
    }>;
    networkError?: {
      statusCode?: number;
      message?: string;
    };
  };

  if (apolloError.networkError?.statusCode === 401) {
    return true;
  }

  const graphQLErrors = apolloError.graphQLErrors ?? [];
  if (
    graphQLErrors.some(
      (gqlError) =>
        gqlError?.extensions?.code === 'UNAUTHENTICATED' ||
        gqlError?.extensions?.originalError?.statusCode === 401
    )
  ) {
    return true;
  }

  const messageBlob = [
    apolloError.message,
    apolloError.networkError?.message,
    ...graphQLErrors.map((gqlError) => gqlError?.message),
    ...graphQLErrors.map((gqlError) => gqlError?.extensions?.originalError?.message),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    messageBlob.includes('unauthenticated') ||
    messageBlob.includes('unauthorized') ||
    messageBlob.includes('invalid csrf token')
  );
};

export const useOnboardingStore = defineStore('onboarding', () => {
  const { osVersion } = storeToRefs(useServerStore());
  const {
    result: onboardingResult,
    loading: onboardingLoading,
    error: onboardingError,
    refetch,
  } = useQuery(ONBOARDING_QUERY, {}, { errorPolicy: 'all' });

  const onboardingData = computed(() => onboardingResult.value?.onboarding);

  // Core state from API
  const status = computed<OnboardingStatus | undefined>(() => onboardingData.value?.status);
  const isPartnerBuild = computed(() => onboardingData.value?.isPartnerBuild ?? false);
  const completed = computed(() => onboardingData.value?.completed ?? false);
  const completedAtVersion = computed(() => onboardingData.value?.completedAtVersion);

  // Derived helpers for component logic
  const isUpgrade = computed(() => status.value === 'UPGRADE');
  const isDowngrade = computed(() => status.value === 'DOWNGRADE');
  const isVersionDrift = computed(() => status.value === 'UPGRADE' || status.value === 'DOWNGRADE');
  const isIncomplete = computed(() => status.value === 'INCOMPLETE');
  const isCompleted = computed(() => status.value === 'COMPLETED');
  const isVersionSupported = computed(() => {
    const parsedVersion = parseMajorMinorVersion(osVersion.value);
    if (!parsedVersion) {
      return false;
    }

    if (parsedVersion.major > MIN_ONBOARDING_MAJOR) {
      return true;
    }
    if (parsedVersion.major < MIN_ONBOARDING_MAJOR) {
      return false;
    }

    return parsedVersion.minor >= MIN_ONBOARDING_MINOR;
  });
  const isUnauthenticated = computed(() => isUnauthenticatedApolloError(onboardingError.value));
  const canDisplayOnboardingModal = computed(() => isVersionSupported.value && !isUnauthenticated.value);

  // Decision: should we show the onboarding modal?
  const shouldShowOnboarding = computed(() => {
    if (!canDisplayOnboardingModal.value) {
      return false;
    }

    // Show onboarding if status is INCOMPLETE or UPGRADE
    return status.value === 'INCOMPLETE' || status.value === 'UPGRADE' || status.value === 'DOWNGRADE';
  });

  return {
    loading: computed(() => onboardingLoading.value),
    // Core state
    status,
    isPartnerBuild,
    completed,
    completedAtVersion,
    // Derived helpers
    isUpgrade,
    isDowngrade,
    isVersionDrift,
    isIncomplete,
    isCompleted,
    isVersionSupported,
    isUnauthenticated,
    canDisplayOnboardingModal,
    shouldShowOnboarding,
    // Actions
    refetchOnboarding: refetch,
  };
});

// Keep the old name as an alias for backward compatibility during migration
export const useUpgradeOnboardingStore = useOnboardingStore;
