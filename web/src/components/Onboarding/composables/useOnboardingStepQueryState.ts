import { computed, ref } from 'vue';

import type { Ref } from 'vue';

type QueryErrorRef = Readonly<Ref<unknown | null | undefined>>;
type QueryLoadingRef = Readonly<Ref<boolean>>;
type QueryReadyRef = Readonly<Ref<boolean>>;

export interface OnboardingStepQueryStateOptions {
  errors: QueryErrorRef[];
  loadings?: QueryLoadingRef[];
  ready: QueryReadyRef;
  retry: () => Promise<unknown> | undefined;
}

export const useOnboardingStepQueryState = ({
  errors,
  loadings = [],
  ready,
  retry,
}: OnboardingStepQueryStateOptions) => {
  const isRetrying = ref(false);

  const stepQueryError = computed(() => {
    const matchingError = errors.find((errorRef) => Boolean(errorRef.value));
    return matchingError?.value ?? null;
  });

  const isStepQueryLoading = computed(
    () =>
      isRetrying.value ||
      loadings.some((loadingRef) => loadingRef.value) ||
      (!ready.value && !stepQueryError.value)
  );

  const retryQueries = async () => {
    if (isRetrying.value) {
      return;
    }

    isRetrying.value = true;
    try {
      await retry();
    } finally {
      isRetrying.value = false;
    }
  };

  return {
    isRetrying,
    isStepQueryLoading,
    retryQueries,
    stepQueryError,
  };
};
