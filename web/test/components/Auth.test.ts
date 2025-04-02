import { ref } from 'vue';
import { createI18n } from 'vue-i18n';
import { createPinia, setActivePinia } from 'pinia';

import { fireEvent, render, screen } from '@testing-library/vue';
import { AlertCircle } from 'lucide-vue-next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ServerStateData, ServerStateDataAction, ServerStateDataActionType } from '@/types/server';

import { useServerStore } from '~/store/server';
import AuthComponent from '../../components/Auth.ce.vue';

// Mock the store with reactive refs
const mockAuthAction = ref<ServerStateDataAction | undefined>({
  name: 'test-action' as ServerStateDataActionType,
  disabled: false,
  icon: AlertCircle,
  text: 'Test Button',
  title: 'Test Title',
  click: vi.fn(),
});

const mockStateData = ref<ServerStateData>({
  error: false,
  heading: 'Test Heading',
  message: 'Test Message',
  humanReadable: 'Test Human Readable',
});

vi.mock('~/store/server', () => ({
  // Return refs from the mocked store hook
  useServerStore: () => ({
    authAction: mockAuthAction,
    stateData: mockStateData,
  }),
}));

// Create a basic i18n instance for testing
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      // Add minimal translations if needed by the component, otherwise empty is fine
      'Test Heading': 'Test Heading',
      'Test Message': 'Test Message',
      'Error Heading': 'Error Heading',
      'Error Message': 'Error Message',
      'Test Button': 'Test Button',
      'Test Title': 'Test Title',
    },
  },
});

describe('AuthComponent', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    // Reset store state refs
    mockAuthAction.value = {
      name: 'test-action' as ServerStateDataActionType,
      disabled: false,
      icon: AlertCircle,
      text: 'Test Button',
      title: 'Test Title',
      click: vi.fn(),
    };
    mockStateData.value = {
      error: false,
      heading: 'Test Heading',
      message: 'Test Message',
      humanReadable: 'Test Human Readable',
    };
  });

  it('renders the auth button when authAction is present', () => {
    render(AuthComponent, {
      global: {
        plugins: [i18n],
      },
    });

    const button = screen.getByText('Test Button');
    expect(button).toBeDefined();
    expect((button as HTMLElement).getAttribute('title')).toBe('Test Title');
  });

  it('renders error message when stateData.error is true', () => {
    // Override the mock for this test by updating the refs
    mockAuthAction.value = undefined;
    mockStateData.value = {
      error: true,
      heading: 'Error Heading',
      message: 'Error Message',
      humanReadable: 'Error Human Readable',
    } as ServerStateData;

    render(AuthComponent, {
      global: {
        plugins: [i18n],
      },
    });

    const heading = screen.getByText('Error Heading');
    const message = screen.getByText('Error Message');

    expect(heading).toBeDefined();
    expect(message).toBeDefined();
    expect(heading.tagName).toBe('H3');
  });

  it('calls click handler when button is clicked', async () => {
    const mockClick = vi.fn();
    // Update the ref with the specific mock function
    mockAuthAction.value = {
      name: 'test-action' as ServerStateDataActionType,
      disabled: false,
      icon: AlertCircle,
      text: 'Test Button',
      title: 'Test Title',
      click: mockClick,
    };
    mockStateData.value = {
      error: false,
      heading: '',
      message: '',
      humanReadable: '',
    } as ServerStateData;

    render(AuthComponent, {
      global: {
        plugins: [i18n],
      },
    });

    const button = screen.getByText('Test Button');
    await fireEvent.click(button);
    expect(mockClick).toHaveBeenCalled();
  });
});
