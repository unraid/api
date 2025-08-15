import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { PUBLIC_OIDC_PROVIDERS } from '../queries/public-oidc-providers.query';

export interface OidcProvider {
  id: string;
  name: string;
  buttonText?: string | null;
  buttonIcon?: string | null;
  buttonVariant?: string | null;
  buttonStyle?: string | null;
}

export function useSsoProviders() {
  const pollInterval = ref<NodeJS.Timeout | null>(null);
  const apiAvailable = ref(false);
  const checkingApi = ref(true);

  // Query for OIDC providers with polling
  const { result: providersResult, refetch: refetchProviders } = useQuery(
    PUBLIC_OIDC_PROVIDERS, 
    null, 
    {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    }
  );

  const oidcProviders = computed<OidcProvider[]>(() => 
    providersResult.value?.publicOidcProviders ?? []
  );

  // Check if there are any providers configured
  const hasProviders = computed(() => oidcProviders.value.length > 0);

  // Check if API is available
  const checkApiAvailability = async () => {
    try {
      await refetchProviders();
      apiAvailable.value = true;
      checkingApi.value = false;
      // Stop polling once API is available
      if (pollInterval.value) {
        clearInterval(pollInterval.value);
        pollInterval.value = null;
      }
    } catch {
      apiAvailable.value = false;
      // Continue polling if API is not available
    }
  };

  // Start polling when component mounts
  onMounted(() => {
    checkApiAvailability();
    // Poll every 2 seconds if API is not available
    pollInterval.value = setInterval(() => {
      if (!apiAvailable.value) {
        checkApiAvailability();
      }
    }, 2000);
  });

  // Clean up polling on unmount
  onUnmounted(() => {
    if (pollInterval.value) {
      clearInterval(pollInterval.value);
    }
  });

  return {
    oidcProviders,
    hasProviders,
    checkingApi,
    apiAvailable,
  };
}
