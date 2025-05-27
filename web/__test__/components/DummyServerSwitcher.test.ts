/**
 * DummyServerSwitcher Component Test Coverage
 */

import { nextTick } from 'vue';
import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';

import { Select, SelectTrigger } from '@unraid/ui';
import { createTestingPinia } from '@pinia/testing';
import { defaultServer, useDummyServerStore } from '~/_data/serverState';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ServerSelector } from '~/_data/serverState';

import DummyServerSwitcher from '~/components/DummyServerSwitcher.vue';

vi.mock('@unraid/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@unraid/ui')>();

  return {
    ...actual,
  };
});

describe('DummyServerSwitcher', () => {
  let dummyServerStore: ReturnType<typeof useDummyServerStore>;
  let modalDiv: HTMLDivElement;

  beforeEach(() => {
    const pinia = createTestingPinia({ createSpy: vi.fn });

    setActivePinia(pinia);
    dummyServerStore = useDummyServerStore();
    dummyServerStore.selector = defaultServer;
    vi.clearAllMocks();

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { assign: vi.fn(), search: '?local=true' },
    });
    modalDiv = document.createElement('div');
    modalDiv.id = 'modals';
    document.body.appendChild(modalDiv);
  });

  afterEach(() => {
    document.body.removeChild(modalDiv);
    vi.clearAllMocks();
  });

  it('renders initial state correctly', () => {
    const wrapper = mount(DummyServerSwitcher);

    expect(wrapper.find('h1').text()).toBe('Server State Selection');
    expect(wrapper.find('details > summary').text()).toContain('Initial Server State: default');

    const expectedInitialState = JSON.stringify(dummyServerStore.serverState, null, 4);

    expect(wrapper.find('details > pre').text()).toBe(expectedInitialState);
    expect(wrapper.findComponent(SelectTrigger).exists()).toBe(true);
  });

  it('updates the store selector and displayed state when selection changes', async () => {
    const wrapper = mount(DummyServerSwitcher, {
      // Stub Select to simplify interaction
      global: {
        stubs: {
          Select: {
            template: '<div />',
            props: ['modelValue'],
            emits: ['update:modelValue'],
          },
        },
      },
    });

    const selectComponent = wrapper.findComponent(Select);

    expect(dummyServerStore.selector).toBe('default');

    const newSelection: ServerSelector = 'oemActivation';

    await selectComponent.vm.$emit('update:modelValue', newSelection);
    await nextTick();

    expect(dummyServerStore.selector).toBe(newSelection);
    expect(wrapper.find('details > summary').text()).toContain(`Initial Server State: ${newSelection}`);

    const expectedNewState = JSON.stringify(dummyServerStore.serverState, null, 4);

    expect(wrapper.find('details > pre').text()).toBe(expectedNewState);
  });

  // More tests to come
});
