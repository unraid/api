/**
 * Modal Component Test Coverage
 */

import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MountingOptions, VueWrapper } from '@vue/test-utils';
import type { Props as ModalProps } from '~/components/Modal.vue';

import Modal from '~/components/Modal.vue';
import { createTestI18n } from '../utils/i18n';

const mockSetProperty = vi.fn();
const mockRemoveProperty = vi.fn();

Object.defineProperty(document.body.style, 'setProperty', {
  value: mockSetProperty,
  writable: true,
});
Object.defineProperty(document.body.style, 'removeProperty', {
  value: mockRemoveProperty,
  writable: true,
});

const t = (key: string) => key;

describe('Modal', () => {
  let wrapper: VueWrapper<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    wrapper?.unmount();
    document.body.style.removeProperty('overflow');
    vi.restoreAllMocks();
  });

  const mountModal = (options: MountingOptions<ModalProps> = {}) => {
    const { slots, ...restOptions } = options;

    return mount(Modal, {
      props: {
        open: true,
        ...(restOptions.props || {}),
      },
      slots: slots as Record<string, string>,
      global: {
        stubs: {
          TransitionRoot: {
            template: '<div v-show="show"><slot /></div>',
            props: ['show'],
          },
          TransitionChild: {
            template: '<div><slot /></div>',
          },
          ...(restOptions.global?.stubs || {}),
        },
        plugins: [createTestI18n()],
        ...(restOptions.global || {}),
      },
      attachTo: restOptions.attachTo,
    });
  };

  it('applies and removes body scroll lock based on open prop', async () => {
    wrapper = mount(Modal, {
      props: {
        open: false,
      },
      global: {
        plugins: [createTestI18n()],
      },
    });

    // Initially hidden
    expect(mockSetProperty).not.toHaveBeenCalled();

    await wrapper.setProps({ open: true });
    await nextTick();

    expect(mockSetProperty).toHaveBeenCalledWith('overflow', 'hidden');

    mockSetProperty.mockClear();
    mockRemoveProperty.mockClear();

    await wrapper.setProps({ open: false });
    await nextTick();

    expect(mockRemoveProperty).toHaveBeenCalledWith('overflow');
    expect(mockSetProperty).not.toHaveBeenCalled();
  });

  it('renders description in main content', async () => {
    const testDescription = 'This is the modal description.';

    wrapper = mountModal({ props: { description: testDescription } });

    const main = wrapper.find('[class*="max-h-"]');

    expect(main.find('h2').exists()).toBe(true);
    expect(main.text()).toContain(testDescription);
  });

  it('does not emit close event on overlay click when disableOverlayClose is true', async () => {
    wrapper = mountModal({ props: { disableOverlayClose: true } });

    const overlay = wrapper.find('[class*="fixed inset-0 z-0"]');

    await overlay.trigger('click');

    expect(wrapper.emitted('close')).toBeUndefined();
  });

  it('emits close event when Escape key is pressed', async () => {
    wrapper = mountModal({ attachTo: document.body });

    await wrapper.find('[role="dialog"]').trigger('keyup.esc');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('applies maxWidth class correctly', async () => {
    const maxWidth = 'sm:max-w-2xl';

    wrapper = mount(Modal, {
      props: {
        open: true,
        maxWidth,
      },
      global: {
        plugins: [createTestI18n()],
      },
    });

    await nextTick();

    expect(wrapper.find('[class*="sm:max-w-"]').classes()).toContain(maxWidth);
  });

  it('applies error and success classes correctly', async () => {
    wrapper = mount(Modal, {
      props: {
        open: true,
        error: true,
      },
      global: {
        plugins: [createTestI18n()],
      },
    });

    await nextTick();

    let modalDiv = wrapper.find('.text-left.relative.z-10');

    expect(modalDiv.classes()).toContain('shadow-unraid-red/30');
    expect(modalDiv.classes()).toContain('border-unraid-red/10');

    wrapper.setProps({ error: false, success: true });

    await nextTick();

    modalDiv = wrapper.find('.text-left.relative.z-10');

    expect(modalDiv.classes()).toContain('shadow-green-600/30');
    expect(modalDiv.classes()).toContain('border-green-600/10');
  });

  it('disables shadow-sm when disableShadow is true', async () => {
    wrapper = mount(Modal, {
      props: {
        open: true,
        disableShadow: true,
      },
      global: {
        plugins: [createTestI18n()],
      },
    });

    await nextTick();

    const modalDiv = wrapper.find('.text-left.relative.z-10');

    expect(modalDiv.classes()).toContain('shadow-none');
    expect(modalDiv.classes()).toContain('border-none');
  });

  it('applies header justification class based on headerJustifyCenter prop', async () => {
    wrapper = mount(Modal, {
      props: {
        open: true,
        headerJustifyCenter: false,
      },
      global: {
        plugins: [createTestI18n()],
      },
    });

    await nextTick();

    expect(wrapper.find('header').classes()).toContain('justify-between');
    expect(wrapper.find('header').classes()).not.toContain('justify-center');

    wrapper.setProps({ headerJustifyCenter: true });

    await nextTick();

    expect(wrapper.find('header').classes()).toContain('justify-center');
    expect(wrapper.find('header').classes()).not.toContain('justify-between');
  });

  it('applies overlay color and opacity classes', async () => {
    const overlayColor = 'bg-blue-500';
    const overlayOpacity = 'bg-opacity-50';

    wrapper = mount(Modal, {
      props: {
        open: true,
        overlayColor,
        overlayOpacity,
      },
      global: {
        plugins: [createTestI18n()],
      },
    });

    await nextTick();

    const overlay = wrapper.find('.fixed.inset-0.z-0');

    expect(overlay.classes()).toContain(overlayColor);
    expect(overlay.classes()).toContain(overlayOpacity);
  });
});
