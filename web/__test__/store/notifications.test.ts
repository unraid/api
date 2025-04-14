/**
 * Notifications store test coverage
 */

import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it } from 'vitest';

import type {
  NotificationFragmentFragment,
  NotificationImportance,
  NotificationType,
} from '~/composables/gql/graphql';

import { useNotificationsStore } from '~/store/notifications';

describe('Notifications Store', () => {
  let store: ReturnType<typeof useNotificationsStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useNotificationsStore();
  });

  describe('State and Initialization', () => {
    it('should initialize with empty notifications array', () => {
      expect(store.notifications).toEqual([]);
    });

    it('should initialize with isOpen set to false', () => {
      expect(store.isOpen).toBe(false);
    });
  });

  describe('Getters', () => {
    it('should return correct title based on isOpen state', () => {
      // Initial state (closed)
      expect(store.title).toBe('Notifications Are Closed');

      // After opening
      store.toggle();
      expect(store.title).toBe('Notifications Are Open');

      // After closing again
      store.toggle();
      expect(store.title).toBe('Notifications Are Closed');
    });
  });

  describe('Actions', () => {
    it('should toggle isOpen state', () => {
      // Initial state is false
      expect(store.isOpen).toBe(false);

      // First toggle - should become true
      store.toggle();
      expect(store.isOpen).toBe(true);

      // Second toggle - should become false again
      store.toggle();
      expect(store.isOpen).toBe(false);
    });

    it('should set notifications correctly', () => {
      const mockNotifications: NotificationFragmentFragment[] = [
        {
          __typename: 'Notification',
          id: '1',
          title: 'Test Notification 1',
          subject: 'Test Subject 1',
          description: 'This is a test notification 1',
          importance: 'NORMAL' as NotificationImportance,
          type: 'SYSTEM' as NotificationType,
          timestamp: '2023-01-01T12:00:00Z',
          formattedTimestamp: 'Jan 1, 2023',
        },
        {
          __typename: 'Notification',
          id: '2',
          title: 'Test Notification 2',
          subject: 'Test Subject 2',
          description: 'This is a test notification 2',
          importance: 'HIGH' as NotificationImportance,
          type: 'UPDATE' as NotificationType,
          timestamp: '2023-01-02T12:00:00Z',
          formattedTimestamp: 'Jan 2, 2023',
          link: 'https://example.com',
        },
      ];

      store.setNotifications(mockNotifications);

      expect(store.notifications).toEqual(mockNotifications);
      expect(store.notifications.length).toBe(2);
      expect(store.notifications[0].id).toBe('1');
      expect(store.notifications[1].id).toBe('2');
    });
  });
});
