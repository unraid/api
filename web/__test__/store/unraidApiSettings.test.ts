/**
 * UnraidApiSettings store test coverage
 */

import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WanAccessType, WanForwardType } from '~/composables/gql/graphql';
import { useUnraidApiSettingsStore } from '~/store/unraidApiSettings';

const mockOrigins = ['http://example.com'];
const mockRemoteAccess = {
  accessType: WanAccessType.ALWAYS,
  forwardType: WanForwardType.UPNP,
  port: 8080,
};

const mockLoadFn = vi.fn();
const mockMutateFn = vi.fn();

vi.mock('@vue/apollo-composable', () => ({
  useLazyQuery: () => ({
    load: mockLoadFn,
    result: {
      value: {
        extraAllowedOrigins: mockOrigins,
        remoteAccess: mockRemoteAccess,
      },
    },
  }),
  useMutation: () => ({
    mutate: mockMutateFn.mockImplementation((args) => {
      if (args?.input?.origins) {
        return Promise.resolve({
          data: {
            setAdditionalAllowedOrigins: args.input.origins,
          },
        });
      }
      return Promise.resolve({
        data: {
          setupRemoteAccess: true,
        },
      });
    }),
  }),
}));

describe('UnraidApiSettings Store', () => {
  let store: ReturnType<typeof useUnraidApiSettingsStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useUnraidApiSettingsStore();
    vi.clearAllMocks();
  });

  describe('getAllowedOrigins', () => {
    it('should get origins successfully', async () => {
      const origins = await store.getAllowedOrigins();

      expect(mockLoadFn).toHaveBeenCalled();
      expect(Array.isArray(origins)).toBe(true);
      expect(origins).toEqual(mockOrigins);
    });
  });

  describe('setAllowedOrigins', () => {
    it('should set origins and return the updated list of allowed origins', async () => {
      const newOrigins = ['http://example.com', 'http://test.com'];
      const result = await store.setAllowedOrigins(newOrigins);

      expect(mockMutateFn).toHaveBeenCalledWith({
        input: { origins: newOrigins },
      });
      expect(result).toEqual(newOrigins);
    });
  });

  describe('getRemoteAccess', () => {
    it('should get remote access configuration successfully', async () => {
      const result = await store.getRemoteAccess();

      expect(mockLoadFn).toHaveBeenCalled();

      expect(result).toBeDefined();

      if (result) {
        expect(result).toEqual(mockRemoteAccess);
        expect(result.accessType).toBe(WanAccessType.ALWAYS);
        expect(result.forwardType).toBe(WanForwardType.UPNP);
        expect(result.port).toBe(8080);
      }
    });
  });

  describe('setupRemoteAccess', () => {
    it('should setup remote access successfully and return true', async () => {
      const input = {
        accessType: WanAccessType.ALWAYS,
        forwardType: WanForwardType.STATIC,
        port: 9090,
      };

      const result = await store.setupRemoteAccess(input);

      expect(mockMutateFn).toHaveBeenCalledWith({ input });
      expect(result).toBe(true);
    });
  });
});
