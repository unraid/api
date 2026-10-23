import { defineComponent } from 'vue';
import { createI18n } from 'vue-i18n';
import { enableAutoUnmount, mount } from '@vue/test-utils';

import enUS from '~/locales/en.json';
import dayjs from 'dayjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ServerDateTimeFormat } from '~/types/server';
import type { DefaultLocaleMessageSchema } from 'vue-i18n';

import useDateTimeHelper from '~/composables/dateTime';
import { testTranslate } from '../utils/i18n';

enableAutoUnmount(afterEach);

const createTranslate = () =>
  createI18n<DefaultLocaleMessageSchema, 'en-US', false>({
    legacy: false,
    locale: 'en-US',
    messages: { 'en-US': enUS },
  }).global.t;

const formatDateWithComponent = (
  dateTimeFormat: ServerDateTimeFormat | undefined,
  hideMinutesSeconds: boolean,
  providedDateTime: number
) => {
  const wrapper = mount(
    defineComponent({
      setup() {
        const { outputDateTimeFormatted } = useDateTimeHelper(
          dateTimeFormat,
          testTranslate,
          hideMinutesSeconds,
          providedDateTime
        );
        return { outputDateTimeFormatted };
      },
      template: '<div />',
    })
  );

  const output = (wrapper.vm as unknown as { outputDateTimeFormatted: string | { value: string } })
    .outputDateTimeFormatted;
  const formatted = typeof output === 'string' ? output : output.value;
  wrapper.unmount();
  return formatted;
};

describe('useDateTimeHelper', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 2, 2, 2, 3, 4));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('falls back to default date format when server format is empty', () => {
    const timestamp = new Date(2025, 0, 2, 3, 4, 5).getTime();
    const formatted = formatDateWithComponent({ date: '', time: '' }, true, timestamp);

    expect(formatted).toBe(dayjs(timestamp).format('dddd, MMMM D, YYYY'));
  });

  it('falls back to default date format when server format is unknown', () => {
    const timestamp = new Date(2025, 0, 2, 3, 4, 5).getTime();
    const formatted = formatDateWithComponent({ date: '%Q', time: '%Q' }, true, timestamp);

    expect(formatted).toBe(dayjs(timestamp).format('dddd, MMMM D, YYYY'));
  });

  it('falls back to default time format when server time format is unknown', () => {
    const timestamp = new Date(2025, 0, 2, 3, 4, 5).getTime();
    const formatted = formatDateWithComponent({ date: '%c', time: '%Q' }, false, timestamp);

    expect(formatted).toBe(dayjs(timestamp).format('ddd, D MMMM YYYY hh:mma'));
  });

  it('updates elapsed time each second and stops its timer on unmount', () => {
    const timestamp = Date.now() - 59_000;
    const t = createTranslate();
    const wrapper = mount(
      defineComponent({
        setup: () => useDateTimeHelper(undefined, t, false, timestamp, true),
        template: '<div />',
      })
    );

    expect(wrapper.vm.outputDateTimeReadableDiff).toBe('59 seconds');
    vi.advanceTimersByTime(1000);
    expect(wrapper.vm.outputDateTimeReadableDiff).toBe('1 minute');
    expect(wrapper.vm.outputDateTimeReadableDiffShort).toBe('1 minute');

    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    {
      name: 'short February after January 31',
      now: new Date(2025, 2, 2),
      provided: new Date(2025, 0, 31),
      countUp: true,
      full: '1 month 2 days',
      short: '1 month',
    },
    {
      name: 'year boundary',
      now: new Date(2025, 0, 2),
      provided: new Date(2023, 11, 31),
      countUp: true,
      full: '1 year 2 days',
      short: '1 year',
    },
    {
      name: 'future countdown',
      now: new Date(2025, 0, 2, 3, 4),
      provided: new Date(2025, 0, 2, 3, 5),
      countUp: false,
      full: '1 minute',
      short: '1 minute',
    },
    {
      name: 'equal timestamps',
      now: new Date(2025, 0, 2),
      provided: new Date(2025, 0, 2),
      countUp: true,
      full: '',
      short: '',
    },
  ])('formats $name consistently', ({ now, provided, countUp, full, short }) => {
    vi.setSystemTime(now);
    const t = createTranslate();
    const wrapper = mount(
      defineComponent({
        setup: () => useDateTimeHelper(undefined, t, false, provided.getTime(), countUp),
        template: '<div />',
      })
    );

    expect(wrapper.vm.outputDateTimeReadableDiff).toBe(full);
    expect(wrapper.vm.outputDateTimeReadableDiffShort).toBe(short);
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
