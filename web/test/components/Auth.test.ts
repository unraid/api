import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import AuthComponent from '~/components/Auth.ce.vue';

type Translations = {
  'auth.button.title': string;
  'auth.button.text': string;
  'auth.error.message': string;
};

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: keyof Translations) => {
      const translations: Translations = {
        'auth.button.title': 'Authenticate',
        'auth.button.text': 'Click to authenticate',
        'auth.error.message': 'Authentication failed',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock the BrandButton component
vi.mock('@unraid/ui', () => ({
  BrandButton: {
    name: 'BrandButton',
    template: '<button><slot /></button>',
  },
}));

describe('AuthComponent', () => {
  const renderComponent = (props = {}) => {
    const mockAuthAction = ref('authenticate');
    const mockStateData = ref({
      error: false,
      message: '',
    });

    return mount(AuthComponent, {
      props: {
        authAction: mockAuthAction.value,
        stateData: mockStateData.value,
        ...props,
      },
    });
  };

  it('renders the auth button when authAction is present', async () => {
    const wrapper = renderComponent();
    const button = await wrapper.find('button');
    expect(button.exists()).toBe(true);
    expect(button.text()).toBe('Click to authenticate');
  });

  it('renders error message when stateData.error is true', async () => {
    const wrapper = renderComponent({
      stateData: {
        error: true,
        message: 'Authentication failed',
      },
    });
    const errorMessage = await wrapper.find('.error-message');
    expect(errorMessage.exists()).toBe(true);
    expect(errorMessage.text()).toBe('Authentication failed');
  });

  it('calls click handler when button is clicked', async () => {
    const mockClick = vi.fn();
    const wrapper = renderComponent();
    wrapper.vm.$emit = mockClick;

    const button = await wrapper.find('button');
    await button.trigger('click');

    expect(mockClick).toHaveBeenCalled();
  });
});
