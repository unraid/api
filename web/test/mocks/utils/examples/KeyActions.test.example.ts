/**
 * Example: KeyActions component test using the component-mock utility
 *
 * This file shows how to implement tests for the KeyActions component using
 * the createKeyActionsTest factory from key-actions-mock.ts
 */

import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ServerStateDataAction, ServerStateDataActionType } from '~/types/server';

import { createKeyActionsTest } from './key-actions-mock';

// Sample actions for testing
const sampleActions: ServerStateDataAction[] = [
  {
    name: 'activate' as ServerStateDataActionType,
    text: 'Action 1',
    title: 'Action 1 Title',
    href: '/action1',
    external: true,
    icon: ArrowTopRightOnSquareIcon,
    click: vi.fn(),
  },
  {
    name: 'purchase' as ServerStateDataActionType,
    text: 'Action 2',
    title: 'Action 2 Title',
    href: '/action2',
    external: false,
    disabled: true,
    click: vi.fn(),
  },
  {
    name: 'upgrade' as ServerStateDataActionType,
    text: 'Action 3',
    href: '/action3',
    icon: ArrowTopRightOnSquareIcon,
    click: vi.fn(),
  },
];

// Mock translation function
const tMock = (key: string) => `translated_${key}`;

describe('KeyActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no actions are available', () => {
    const wrapper = createKeyActionsTest({
      storeActions: undefined,
      t: tMock,
    });

    expect(wrapper.find('ul').exists()).toBe(false);
  });

  it('uses actions from store when no actions prop is provided', () => {
    const wrapper = createKeyActionsTest({
      storeActions: sampleActions,
      t: tMock,
    });

    expect(wrapper.findAll('li').length).toBe(3);
    expect(wrapper.find('button').text()).toContain('translated_Action 1');
  });

  it('uses actions from props when provided', () => {
    const customActions: ServerStateDataAction[] = [
      {
        name: 'redeem' as ServerStateDataActionType,
        text: 'Custom 1',
        href: '/custom1',
        click: vi.fn(),
      },
    ];

    const wrapper = createKeyActionsTest({
      actions: customActions,
      storeActions: sampleActions,
      t: tMock,
    });

    expect(wrapper.findAll('li').length).toBe(1);
    expect(wrapper.find('button').text()).toContain('translated_Custom 1');
  });

  it('filters actions by name when filterBy is provided', () => {
    const wrapper = createKeyActionsTest({
      storeActions: sampleActions,
      filterBy: ['activate', 'upgrade'],
      t: tMock,
    });

    expect(wrapper.findAll('li').length).toBe(2);
    expect(wrapper.findAll('button')[0].text()).toContain('translated_Action 1');
    expect(wrapper.findAll('button')[1].text()).toContain('translated_Action 3');
  });

  it('filters out actions by name when filterOut is provided', () => {
    const wrapper = createKeyActionsTest({
      storeActions: sampleActions,
      filterOut: ['purchase'],
      t: tMock,
    });

    expect(wrapper.findAll('li').length).toBe(2);
    expect(wrapper.findAll('button')[0].text()).toContain('translated_Action 1');
    expect(wrapper.findAll('button')[1].text()).toContain('translated_Action 3');
  });

  it('applies maxWidth class when maxWidth prop is true', () => {
    const wrapper = createKeyActionsTest({
      storeActions: sampleActions,
      maxWidth: true,
      t: tMock,
    });

    expect(wrapper.find('button').attributes('class')).toContain('sm:max-w-300px');
  });

  it('does not apply maxWidth class when maxWidth prop is false', () => {
    const wrapper = createKeyActionsTest({
      storeActions: sampleActions,
      maxWidth: false,
      t: tMock,
    });

    expect(wrapper.find('button').attributes('class')).not.toContain('sm:max-w-300px');
  });

  it('renders buttons with correct attributes', () => {
    const wrapper = createKeyActionsTest({
      storeActions: sampleActions,
      t: tMock,
    });

    const buttons = wrapper.findAll('button');

    // First button (action1)
    expect(buttons[0].attributes('href')).toBe('/action1');
    expect(buttons[0].attributes('data-external')).toBe('true');
    expect(buttons[0].attributes('title')).toBe('translated_Action 1 Title');
    expect(buttons[0].attributes('disabled')).toBeUndefined();

    // Second button (action2)
    expect(buttons[1].attributes('href')).toBe('/action2');
    expect(buttons[1].attributes('data-external')).toBe('false');
    expect(buttons[1].attributes('title')).toBe('translated_Action 2 Title');
    expect(buttons[1].attributes('disabled')).toBe('');

    // Third button (action3) - no title specified
    expect(buttons[2].attributes('href')).toBe('/action3');
    expect(buttons[2].attributes('title')).toBeUndefined();
  });

  it('handles button clicks correctly', async () => {
    const wrapper = createKeyActionsTest({
      storeActions: sampleActions,
      t: tMock,
    });

    const buttons = wrapper.findAll('button');

    // Click the first button
    await buttons[0].trigger('click');
    expect(sampleActions[0].click).toHaveBeenCalledTimes(1);

    // Click the third button
    await buttons[2].trigger('click');
    expect(sampleActions[2].click).toHaveBeenCalledTimes(1);
  });

  it('handles undefined filters gracefully', () => {
    const wrapper = createKeyActionsTest({
      storeActions: sampleActions,
      filterBy: undefined,
      filterOut: undefined,
      t: tMock,
    });

    expect(wrapper.findAll('li').length).toBe(3);
  });

  it('returns unfiltered actions when neither filterBy nor filterOut are provided', () => {
    const wrapper = createKeyActionsTest({
      storeActions: sampleActions,
      t: tMock,
    });

    expect(wrapper.findAll('li').length).toBe(3);
  });
});
