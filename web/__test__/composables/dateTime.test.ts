import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';

import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import type { ServerDateTimeFormat } from '~/types/server';

import useDateTimeHelper from '~/composables/dateTime';
import { testTranslate } from '../utils/i18n';

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
  return typeof output === 'string' ? output : output.value;
};

describe('useDateTimeHelper', () => {
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
});
