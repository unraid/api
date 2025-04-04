import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ServerStateDataAction, ServerStateDataActionType } from '~/types/server';

import KeyActions from '../../components/KeyActions.vue';

import '~/test/mocks/ui-components';

// Create mock store actions
const storeKeyActions = [
  { name: 'purchase' as ServerStateDataActionType, text: 'Purchase Key', click: vi.fn() },
  { name: 'redeem' as ServerStateDataActionType, text: 'Redeem Key', click: vi.fn() },
];

// Mock the store and Pinia
vi.mock('pinia', () => ({
  storeToRefs: vi.fn(() => ({
    keyActions: ref(storeKeyActions),
  })),
}));

vi.mock('../../store/server', () => ({
  useServerStore: vi.fn(),
}));

// Mock translation function (simple implementation)
const t = (key: string) => `translated_${key}`;

describe('KeyActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders buttons from store when no actions prop is provided', () => {
    const wrapper = mount(KeyActions, {
      props: { t },
    });

    const buttons = wrapper.findAllComponents(BrandButton);

    expect(buttons.length).toBe(2);
    expect(buttons[0].text()).toContain('translated_Purchase Key');
    expect(buttons[1].text()).toContain('translated_Redeem Key');
  });

  it('renders buttons from props when actions prop is provided', () => {
    const actions: ServerStateDataAction[] = [
      { name: 'purchase' as ServerStateDataActionType, text: 'Custom Action 1', click: vi.fn() },
    ];

    const wrapper = mount(KeyActions, {
      props: {
        t,
        actions,
      },
    });

    const buttons = wrapper.findAllComponents(BrandButton);

    expect(buttons.length).toBe(1);
    expect(buttons[0].text()).toContain('translated_Custom Action 1');
  });

  it('renders an empty list container when actions array is empty', () => {
    const wrapper = mount(KeyActions, {
      props: {
        t,
        actions: [],
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
        t,
        actions,
      },
    });

    // Click the button
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
        t,
        actions,
      },
    });

    // Click the disabled button
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
        t,
        actions,
        filterBy: ['purchase', 'upgrade'],
      },
    });

    const buttons = wrapper.findAllComponents(BrandButton);

    expect(buttons.length).toBe(2);
    expect(buttons[0].text()).toContain('translated_Action 1');
    expect(buttons[1].text()).toContain('translated_Action 3');
  });

  it('filters out actions using filterOut prop', () => {
    const actions: ServerStateDataAction[] = [
      { name: 'purchase' as ServerStateDataActionType, text: 'Action 1', click: vi.fn() },
      { name: 'redeem' as ServerStateDataActionType, text: 'Action 2', click: vi.fn() },
      { name: 'upgrade' as ServerStateDataActionType, text: 'Action 3', click: vi.fn() },
    ];

    const wrapper = mount(KeyActions, {
      props: {
        t,
        actions,
        filterOut: ['redeem'],
      },
    });

    const buttons = wrapper.findAllComponents(BrandButton);

    expect(buttons.length).toBe(2);
    expect(buttons[0].text()).toContain('translated_Action 1');
    expect(buttons[1].text()).toContain('translated_Action 3');
  });

  it('applies maxWidth styling when maxWidth prop is true', () => {
    const actions: ServerStateDataAction[] = [
      { name: 'purchase' as ServerStateDataActionType, text: 'Action 1', click: vi.fn() },
    ];

    const wrapper = mount(KeyActions, {
      props: {
        t,
        actions,
        maxWidth: true,
      },
    });

    const button = wrapper.findComponent(BrandButton);

    expect(button.props('class')).toContain('sm:max-w-300px');
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
        t,
        actions,
      },
    });

    const button = wrapper.findComponent(BrandButton);

    expect(button.props('text')).toBe('translated_Test Action');
    expect(button.props('title')).toBe('translated_Action Title');
    expect(button.props('href')).toBe('/test-link');
    expect(button.props('external')).toBe(true);
    expect(button.props('disabled')).toBe(true);
    expect(button.props('icon')).toBe(ArrowTopRightOnSquareIcon);
  });
});
