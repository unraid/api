/**
 * Trial store test coverage
 */

import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { StartTrialResponse } from '~/composables/services/keyServer';

import { useTrialStore } from '~/store/trial';

const mockAddPreventClose = vi.fn();
const mockRemovePreventClose = vi.fn();
const mockStartTrial = vi.fn();
const mockSaveCallbackData = vi.fn();
const mockDropdownHide = vi.fn();

vi.mock('~/composables/preventClose', () => ({
  addPreventClose: () => mockAddPreventClose(),
  removePreventClose: () => mockRemovePreventClose(),
}));

vi.mock('~/composables/services/keyServer', () => ({
  startTrial: (payload: any) => mockStartTrial(payload),
}));

vi.mock('~/store/callbackActions', () => ({
  useCallbackActionsStore: () => ({
    saveCallbackData: mockSaveCallbackData,
  }),
}));

vi.mock('~/store/dropdown', () => ({
  useDropdownStore: () => ({
    dropdownHide: mockDropdownHide,
  }),
}));

vi.mock('~/store/server', () => ({
  useServerStore: () => ({
    guid: 'test-guid',
  }),
}));

describe('Trial Store', () => {
  let store: ReturnType<typeof useTrialStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useTrialStore();
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockStartTrial.mockResolvedValue({
      license: 'mock-license-key',
    });

    // Suppress console output during tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('State and Getters', () => {
    it('should initialize with ready status', () => {
      expect(store.trialStatus).toBe('ready');
      expect(store.trialModalLoading).toBe(false);
      expect(store.trialModalVisible).toBe(false);
    });

    it('should update trialModalLoading when status is trialExtend or trialStart', () => {
      store.setTrialStatus('ready');
      expect(store.trialModalLoading).toBe(false);

      store.setTrialStatus('trialStart');
      expect(store.trialModalLoading).toBe(true);

      store.setTrialStatus('trialExtend');
      expect(store.trialModalLoading).toBe(true);
    });

    it('should update trialModalVisible when status is trialExtend, trialStart, or failed', () => {
      store.setTrialStatus('ready');
      expect(store.trialModalVisible).toBe(false);

      store.setTrialStatus('trialStart');
      expect(store.trialModalVisible).toBe(true);

      store.setTrialStatus('trialExtend');
      expect(store.trialModalVisible).toBe(true);

      store.setTrialStatus('failed');
      expect(store.trialModalVisible).toBe(true);

      store.setTrialStatus('success');
      expect(store.trialModalVisible).toBe(false);
    });
  });

  describe('Actions', () => {
    it('should set trial status', () => {
      store.setTrialStatus('trialStart');
      expect(store.trialStatus).toBe('trialStart');

      store.setTrialStatus('failed');
      expect(store.trialStatus).toBe('failed');
    });

    it('should call addPreventClose and dropdownHide when status changes to trialStart', async () => {
      const watchSpy = vi.spyOn(global, 'setTimeout');

      store.setTrialStatus('trialStart');

      await vi.runAllTimersAsync();

      expect(mockAddPreventClose).toHaveBeenCalledTimes(1);
      expect(mockDropdownHide).toHaveBeenCalledTimes(1);
      expect(watchSpy).toHaveBeenCalledTimes(1);
      expect(watchSpy).toHaveBeenLastCalledWith(expect.any(Function), 1500);
    });

    it('should call addPreventClose and dropdownHide when status changes to trialExtend', async () => {
      const watchSpy = vi.spyOn(global, 'setTimeout');

      store.setTrialStatus('trialExtend');

      await vi.runAllTimersAsync();

      expect(mockAddPreventClose).toHaveBeenCalledTimes(1);
      expect(mockDropdownHide).toHaveBeenCalledTimes(1);
      expect(watchSpy).toHaveBeenCalledTimes(1);
      expect(watchSpy).toHaveBeenLastCalledWith(expect.any(Function), 1500);
    });

    it('should call removePreventClose when status changes to failed', async () => {
      store.setTrialStatus('failed');
      await nextTick();

      expect(mockRemovePreventClose).toHaveBeenCalledTimes(1);
    });

    it('should call removePreventClose when status changes to success', async () => {
      store.setTrialStatus('success');
      await nextTick();

      expect(mockRemovePreventClose).toHaveBeenCalledTimes(1);
    });

    it('should request trial after delay when status is trialStart', async () => {
      store.setTrialStatus('trialStart');

      await vi.advanceTimersByTimeAsync(1500);

      expect(mockStartTrial).toHaveBeenCalledWith({
        guid: 'test-guid',
        timestamp: expect.any(Number),
      });
    });

    it('should request trial after delay when status is trialExtend', async () => {
      store.setTrialStatus('trialExtend');

      await vi.advanceTimersByTimeAsync(1500);

      expect(mockStartTrial).toHaveBeenCalledWith({
        guid: 'test-guid',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('Trial Request', () => {
    it('should handle successful trial request', async () => {
      await store.requestTrial('trialStart');

      expect(mockStartTrial).toHaveBeenCalledWith({
        guid: 'test-guid',
        timestamp: expect.any(Number),
      });

      expect(mockSaveCallbackData).toHaveBeenCalledWith({
        actions: [
          {
            keyUrl: 'mock-license-key',
            type: 'trialStart',
          },
        ],
        sender: expect.any(String),
        type: 'forUpc',
      });

      expect(store.trialStatus).toBe('success');
    });

    it('should set failed status when no license is returned', async () => {
      mockStartTrial.mockResolvedValueOnce({
        license: undefined,
      } as StartTrialResponse);

      await store.requestTrial('trialStart');

      expect(store.trialStatus).toBe('failed');
      expect(mockSaveCallbackData).not.toHaveBeenCalled();
    });

    it('should set failed status when an error occurs', async () => {
      mockStartTrial.mockRejectedValueOnce(new Error('API error'));

      await store.requestTrial('trialStart');

      expect(store.trialStatus).toBe('failed');
      expect(mockSaveCallbackData).not.toHaveBeenCalled();
    });
  });
});
