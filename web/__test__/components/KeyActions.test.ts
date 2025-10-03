/**
 * KeyActions Component Test Coverage
 */

import { mount } from '@vue/test-utils';

import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';
import { createTestingPinia } from '@pinia/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ServerStateDataAction, ServerStateDataActionType } from '~/types/server';

import KeyActions from '~/components/KeyActions.vue';
import { createTestI18n } from '../utils/i18n';

import '../mocks/ui-components';

vi.mock('crypto-js/aes', () => ({
  default: {},
}));

vi.mock('@unraid/shared-callbacks', () => ({
  useCallback: vi.fn(() => ({
    send: vi.fn(),
    watcher: vi.fn(),
  })),
}));

const t = (key: string) => `${key}`;

describe('KeyActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders buttons from props when actions prop is provided', () => {
    const actions: ServerStateDataAction[] = [
      { name: 'purchase' as ServerStateDataActionType, text: 'Custom Action 1', click: vi.fn() },
    ];

    const wrapper = mount(KeyActions, {
      props: {
        actions,
      },
      global: {
        plugins: [createTestI18n()],
      },
    });

    const buttons = wrapper.findAllComponents(BrandButton);

    expect(buttons.length).toBe(1);
    expect(buttons[0].text()).toContain('Custom Action 1');
  });

  it('renders an empty list container when actions array is empty', () => {
    const wrapper = mount(KeyActions, {
      props: {
        actions: [],
      },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), createTestI18n()],
      },
    });

    expect(wrapper.find('ul').exists()).toBe(true);
    expect(wrapper.findAll('li').length).toBe(0);
  });

  it('calls action click handler when button is clicked', async () => {
    const click = vi.fn();
    const actions: ServerStateDataAction[] = [
      { name: 'purchase' as ServerStateDataActionType, text: 'Clickable Action', click },
    ];

    const wrapper = mount(KeyActions, {
      props: {
        actions,
      },
      global: {
        plugins: [createTestI18n()],
      },
    });

    await wrapper.findComponent(BrandButton).trigger('click');
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('does not call click handler for disabled buttons', async () => {
    const click = vi.fn();
    const actions: ServerStateDataAction[] = [
      {
        name: 'purchase' as ServerStateDataActionType,
        text: 'Disabled Action',
        disabled: true,
        click,
      },
    ];

    const wrapper = mount(KeyActions, {
      props: {
        actions,
      },
      global: {
        plugins: [createTestI18n()],
      },
    });

    await wrapper.findComponent(BrandButton).trigger('click');
    expect(click).not.toHaveBeenCalled();
  });

  it('filters actions using filterBy prop', () => {
    const actions: ServerStateDataAction[] = [
      { name: 'purchase' as ServerStateDataActionType, text: 'Action 1', click: vi.fn() },
      { name: 'redeem' as ServerStateDataActionType, text: 'Action 2', click: vi.fn() },
      { name: 'upgrade' as ServerStateDataActionType, text: 'Action 3', click: vi.fn() },
    ];

    const wrapper = mount(KeyActions, {
      props: {
        actions,
        filterBy: ['purchase', 'upgrade'],
      },
      global: {
        plugins: [createTestI18n()],
      },
    });

    const buttons = wrapper.findAllComponents(BrandButton);

    expect(buttons.length).toBe(2);
    expect(buttons[0].text()).toContain('Action 1');
    expect(buttons[1].text()).toContain('Action 3');
  });

  it('filters out actions using filterOut prop', () => {
    const actions: ServerStateDataAction[] = [
      { name: 'purchase' as ServerStateDataActionType, text: 'Action 1', click: vi.fn() },
      { name: 'redeem' as ServerStateDataActionType, text: 'Action 2', click: vi.fn() },
      { name: 'upgrade' as ServerStateDataActionType, text: 'Action 3', click: vi.fn() },
    ];

    const wrapper = mount(KeyActions, {
      props: {
        actions,
        filterOut: ['redeem'],
      },
      global: {
        plugins: [createTestI18n()],
      },
    });

    const buttons = wrapper.findAllComponents(BrandButton);

    expect(buttons.length).toBe(2);
    expect(buttons[0].text()).toContain('Action 1');
    expect(buttons[1].text()).toContain('Action 3');
  });

  it('applies maxWidth styling when maxWidth prop is true', () => {
    const actions: ServerStateDataAction[] = [
      { name: 'purchase' as ServerStateDataActionType, text: 'Action 1', click: vi.fn() },
    ];

    const wrapper = mount(KeyActions, {
      props: {
        actions,
        maxWidth: true,
      },
      global: {
        plugins: [createTestI18n()],
      },
    });

    const button = wrapper.findComponent(BrandButton);

    expect(button.props('class')).toContain('sm:max-w-[300px]');
  });

  it('passes all required props to BrandButton component', () => {
    const actions: ServerStateDataAction[] = [
      {
        name: 'purchase' as ServerStateDataActionType,
        text: 'Test Action',
        title: 'Action Title',
        href: '/test-link',
        external: true,
        disabled: true,
        icon: ArrowTopRightOnSquareIcon,
        click: vi.fn(),
      },
    ];

    const wrapper = mount(KeyActions, {
      props: {
        actions,
      },
      global: {
        plugins: [createTestI18n()],
      },
    });

    const button = wrapper.findComponent(BrandButton);

    expect(button.props('text')).toBe('Test Action');
    expect(button.props('title')).toBe('Action Title');
    expect(button.props('href')).toBe('/test-link');
    expect(button.props('external')).toBe(true);
    expect(button.props('disabled')).toBe(true);
    expect(button.props('icon')).toBe(ArrowTopRightOnSquareIcon);
  });
});
