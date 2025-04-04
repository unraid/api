/**
 * Auth Component Test Coverage
 */
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import { describe, expect, it, vi } from 'vitest';

import Auth from '~/components/Auth.ce.vue';

// Define types for our mocks
interface AuthAction {
  text: string;
  icon: string;
  click?: () => void;
  disabled?: boolean;
  title?: string;
}

interface StateData {
  error: boolean;
  heading?: string;
  message?: string;
}

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

// Mock the useServerStore composable
const mockServerStore = {
  authAction: ref<AuthAction | undefined>(undefined),
  stateData: ref<StateData>({ error: false }),
};

vi.mock('~/store/server', () => ({
  useServerStore: () => mockServerStore,
}));

// Mock pinia's storeToRefs to simply return the store
vi.mock('pinia', () => ({
  storeToRefs: (store: any) => store,
}));

describe('Auth Component', () => {
  it('displays an authentication button when authAction is available', () => {
    // Configure auth action
    mockServerStore.authAction.value = {
      text: 'Sign in to Unraid',
      icon: 'key',
      click: vi.fn(),
    };
    mockServerStore.stateData.value = { error: false };

    // Mount component
    const wrapper = mount(Auth);

    // Verify button exists
    const button = wrapper.findComponent({ name: 'BrandButton' });
    expect(button.exists()).toBe(true);
    // Check props passed to button
    expect(button.props('text')).toBe('Sign in to Unraid');
    expect(button.props('icon')).toBe('key');
  });

  it('displays error messages when stateData.error is true', () => {
    // Configure with error state
    mockServerStore.authAction.value = {
      text: 'Sign in to Unraid',
      icon: 'key',
    };
    mockServerStore.stateData.value = {
      error: true,
      heading: 'Error Title',
      message: 'Error Message Content',
    };

    // Mount component
    const wrapper = mount(Auth);

    // Verify error message is displayed
    const errorHeading = wrapper.find('h3');

    expect(errorHeading.exists()).toBe(true);
    expect(errorHeading.text()).toBe('Error Title');
    expect(wrapper.text()).toContain('Error Message Content');
  });

  it('calls the click handler when button is clicked', async () => {
    // Create mock click handler
    const clickHandler = vi.fn();

    // Configure with click handler
    mockServerStore.authAction.value = {
      text: 'Sign in to Unraid',
      icon: 'key',
      click: clickHandler,
    };
    mockServerStore.stateData.value = { error: false };

    // Mount component
    const wrapper = mount(Auth);

    // Click the button
    await wrapper.findComponent({ name: 'BrandButton' }).vm.$emit('click');

    // Verify click handler was called
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });

  it('does not render button when authAction is undefined', () => {
    // Configure with undefined auth action
    mockServerStore.authAction.value = undefined;
    mockServerStore.stateData.value = { error: false };

    // Mount component
    const wrapper = mount(Auth);

    // Verify button doesn't exist
    const button = wrapper.findComponent({ name: 'BrandButton' });

    expect(button.exists()).toBe(false);
  });
});
