import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WanAccessType, WanForwardType } from '~/composables/gql/graphql';
import { useUnraidApiSettingsStore } from '~/store/unraidApiSettings';

const mockLoadOrigins = vi.fn().mockResolvedValue(undefined);
const mockLoadRemoteAccess = vi.fn().mockResolvedValue(undefined);
const mockMutateOrigins = vi.fn();
const mockSetupRemoteAccessMutation = vi.fn();

vi.mock('@vue/apollo-composable', () => ({
  useLazyQuery: vi.fn((query) => {
    const name = query?.definitions?.[0]?.name?.value || '';

    if (name === 'getExtraAllowedOrigins') {
      return { load: mockLoadOrigins, result: ref(null) };
    }
    return { load: mockLoadRemoteAccess, result: ref(null) };
  }),
  useMutation: vi.fn((mutation) => {
    const name = mutation?.definitions?.[0]?.name?.value || '';

    if (name === 'setAdditionalAllowedOrigins') {
      return { mutate: mockMutateOrigins };
    }
    return { mutate: mockSetupRemoteAccessMutation };
  }),
}));

describe('UnraidApiSettings Store', () => {
  let store: ReturnType<typeof useUnraidApiSettingsStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    store = useUnraidApiSettingsStore();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllowedOrigins', () => {
    it('should call loadOrigins and return the result', async () => {
      const mockOrigins = ['https://example.com', 'https://test.com'];
      vi.spyOn(store, 'getAllowedOrigins').mockResolvedValueOnce(mockOrigins);

      const result = await store.getAllowedOrigins();

      expect(result).toEqual(mockOrigins);
    });

    it('should return an empty array when origins is empty', async () => {
      vi.spyOn(store, 'getAllowedOrigins').mockResolvedValueOnce([]);

      const result = await store.getAllowedOrigins();

      expect(result).toEqual([]);
    });

    it('should handle rejected loadOrigins request', async () => {
      const actualStore = useUnraidApiSettingsStore();

      mockLoadOrigins.mockImplementationOnce(() => Promise.reject());

      const result = await actualStore.getAllowedOrigins().catch(() => []);

      expect(result).toEqual([]);
    });
  });

  describe('setAllowedOrigins', () => {
    it('should call mutateOrigins with the correct input', async () => {
      mockMutateOrigins.mockResolvedValueOnce({
        data: { setAdditionalAllowedOrigins: true },
      });

      const origins = ['https://example.com', 'https://test.com'];
      const result = await store.setAllowedOrigins(origins);

      expect(mockMutateOrigins).toHaveBeenCalledWith({
        input: { origins },
      });

      expect(result).toBe(true);
    });

    it('should handle error case gracefully', async () => {
      mockMutateOrigins.mockResolvedValueOnce({
        data: { setAdditionalAllowedOrigins: false },
      });

      const result = await store.setAllowedOrigins(['https://example.com']);

      expect(result).toBe(false);
    });

    it('should handle mutation rejection', async () => {
      mockMutateOrigins.mockImplementationOnce(() => Promise.reject());

      const result = await store.setAllowedOrigins(['https://example.com']).catch(() => undefined);

      expect(result).toBeUndefined();
    });

    it('should handle undefined response', async () => {
      mockMutateOrigins.mockResolvedValueOnce(undefined);

      const result = await store.setAllowedOrigins(['https://example.com']);

      expect(result).toBeUndefined();
    });
  });

  describe('getRemoteAccess', () => {
    it('should call loadRemoteAccess and return the result', async () => {
      const mockRemoteAccess = {
        accessType: WanAccessType.ALWAYS,
        forwardType: WanForwardType.STATIC,
        port: 443,
      };

      vi.spyOn(store, 'getRemoteAccess').mockResolvedValueOnce(mockRemoteAccess);

      const result = await store.getRemoteAccess();

      expect(result).toEqual(mockRemoteAccess);
    });

    it('should return undefined when remoteAccess is null', async () => {
      vi.spyOn(store, 'getRemoteAccess').mockResolvedValueOnce(undefined);

      const result = await store.getRemoteAccess();

      expect(result).toBeUndefined();
    });

    it('should handle rejected loadRemoteAccess request', async () => {
      const actualStore = useUnraidApiSettingsStore();

      mockLoadRemoteAccess.mockImplementationOnce(() => Promise.reject());

      const result = await actualStore.getRemoteAccess().catch(() => undefined);

      expect(result).toBeUndefined();
    });
  });

  describe('setupRemoteAccess', () => {
    it('should call setupRemoteAccessMutation with the correct input', async () => {
      mockSetupRemoteAccessMutation.mockResolvedValueOnce({
        data: { setupRemoteAccess: true },
      });

      const input = {
        accessType: WanAccessType.ALWAYS,
        forwardType: WanForwardType.STATIC,
        port: 443,
      };

      const result = await store.setupRemoteAccess(input);

      expect(mockSetupRemoteAccessMutation).toHaveBeenCalledWith({
        input,
      });

      expect(result).toBe(true);
    });

    it('should handle null response', async () => {
      mockSetupRemoteAccessMutation.mockResolvedValueOnce(null);

      const input = { accessType: WanAccessType.DISABLED };
      const result = await store.setupRemoteAccess(input);

      expect(result).toBeUndefined();
    });

    it('should handle disabled access type', async () => {
      mockSetupRemoteAccessMutation.mockResolvedValueOnce({
        data: { setupRemoteAccess: true },
      });

      const input = { accessType: WanAccessType.DISABLED };

      const result = await store.setupRemoteAccess(input);

      expect(mockSetupRemoteAccessMutation).toHaveBeenCalledWith({
        input,
      });

      expect(result).toBe(true);
    });

    it('should handle mutation rejection', async () => {
      mockSetupRemoteAccessMutation.mockImplementationOnce(() => Promise.reject());

      const input = { accessType: WanAccessType.ALWAYS };

      const result = await store.setupRemoteAccess(input).catch(() => undefined);

      expect(result).toBeUndefined();
    });
  });

  describe('Integration Tests', () => {
    it('should be able to set and then get allowed origins', async () => {
      const mockOrigins = ['https://example.com'];

      mockMutateOrigins.mockResolvedValueOnce({
        data: { setAdditionalAllowedOrigins: true },
      });

      const originsRef = ref({ extraAllowedOrigins: mockOrigins });
      mockLoadOrigins.mockImplementationOnce(async () => {
        Object.defineProperty(store, 'origins', {
          get: () => originsRef,
        });
      });

      await store.setAllowedOrigins(mockOrigins);

      const getStore = useUnraidApiSettingsStore();
      vi.spyOn(getStore, 'getAllowedOrigins').mockResolvedValueOnce(mockOrigins);

      const result = await getStore.getAllowedOrigins();

      expect(result).toEqual(mockOrigins);
      expect(mockMutateOrigins).toHaveBeenCalledWith({
        input: { origins: mockOrigins },
      });
    });
  });
});
