import { ref, computed, onBeforeMount, onBeforeUnmount } from 'vue';
import dayjs, { extend } from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import type { ComposerTranslation } from 'vue-i18n';

import type { DateFormatOption, ServerDateTimeFormat, TimeFormatOption } from '~/types/server';

/** @see https://day.js.org/docs/en/display/format#localized-formats */
extend(localizedFormat);

export interface TimeStringsObject {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  firstDateWasLater: boolean;
  displaySeconds?: boolean;
}

const dateFormatOptions: DateFormatOption[] = [
  { format: '%c', display: 'ddd, D MMMM YYYY' }, // aka "system settings" in the date time settings of the webgui
  { format: '%A, %Y %B %e', display: 'ddd, YYYY MMMM D' },
  { format: '%A, %e %B %Y', display: 'ddd, D MMMM YYYY' },
  { format: '%A, %B %e, %Y', display: 'ddd, MMMM D, YYYY' },
  { format: '%A, %m/%d/%Y', display: 'ddd, MM/DD/YYYY' },
  { format: '%A, %d-%m-%Y', display: 'ddd, DD-MM-YYYY' },
  { format: '%A, %d.%m.%Y', display: 'ddd, DD.MM.YYYY' },
  { format: '%A, %Y-%m-%d', display: 'ddd, YYYY-MM-DD' },
];

const timeFormatOptions: TimeFormatOption[] = [
  { format: '%I:%M %p', display: 'hh:mma' },
  { format: '%R', display: 'HH:mm' },
];

/**
 * the provided ref may not have a value until we get a response from the refreshServerState action
 * So we need to watch for this value to be able to format it based on the user's date time preferences.
 * @example below is how to use this composable
 * const formattedRegExp = ref<any>();
 * const setFormattedRegExp = () => { // ran in watch on regExp and onBeforeMount
 * if (!regExp.value) { return; }
 *   const { outputDateTimeFormatted } = useDateTimeHelper(dateTimeFormat.value, props.t, true, regExp.value);
 *   formattedRegExp.value = outputDateTimeFormatted.value;
 * };
 * watch(regExp, (_newV) => {
 *   setFormattedRegExp();
 * });
 * onBeforeMount(() => {
 *   setFormattedRegExp();
 * });
 *
 * @param format provided by Unraid server's state.php and set in the server store
 * @param t translations
 * @param hideMinutesSeconds true will hide minutes and seconds from the output
 * @param providedDateTime optional provided date time to use instead of Date.now()
 * @param diffCountUp true will count up from the provided date time instead of down
 */
const useDateTimeHelper = (
  format: ServerDateTimeFormat | undefined,
  t: ComposerTranslation,
  hideMinutesSeconds?: boolean,
  providedDateTime?: number | undefined,
  diffCountUp?: boolean,
) => {
  const buildStringFromValues = (payload: TimeStringsObject) => {
    const {
      years,
      months,
      days,
      hours,
      minutes,
      seconds,
      firstDateWasLater,
      displaySeconds,
    } = payload;
    const result = [];

    if (years) { result.push(t('year', years)); }
    if (months) { result.push(t('month', months)); }
    if (days) { result.push(t('day', days)); }
    if (hours) { result.push(t('hour', hours)); }
    if (minutes) { result.push(t('minute', minutes)); }
    if (seconds && ((!years && !months && !days && !hours && !minutes) || displaySeconds)) { result.push(t('second', seconds)); }
    if (firstDateWasLater) { result.push(t('ago')); }
    return result.join(' ');
  };

  // use the format from the server to determine the format to use
  const findMatchingFormat = (
    selectedFormat: string,
    formats: DateFormatOption[] | TimeFormatOption[],
  ): DateFormatOption | TimeFormatOption | undefined =>
    formats.find(formatOption => formatOption.format === selectedFormat);

  const dateFormat = findMatchingFormat(format?.date ?? dateFormatOptions[0].format, dateFormatOptions);

  let displayFormat = `${dateFormat?.display}`;
  if (!hideMinutesSeconds) {
    const timeFormat = findMatchingFormat(format?.time ?? timeFormatOptions[0].format, timeFormatOptions);
    displayFormat = `${displayFormat} ${timeFormat?.display}`;
  }

  const formatDate = (date: number): string =>
    dayjs(date).format(displayFormat);

  /**
 * Original meat and potatos from:
 * @version: 1.0.1
 * @author: huangjinlin
 * @repo: https://github.com/huangjinlin/dayjs-precise-range
 */
  const buildValueObject = (
    yDiff: number,
    mDiff: number,
    dDiff: number,
    hourDiff: number,
    minDiff: number,
    secDiff: number,
    firstDateWasLater: boolean
  ): TimeStringsObject => ({
    years: yDiff,
    months: mDiff,
    days: dDiff,
    hours: hourDiff,
    minutes: minDiff,
    seconds: secDiff,
    firstDateWasLater,
  });

  const preciseDateDiff = (d1: dayjs.Dayjs, d2: dayjs.Dayjs): TimeStringsObject => {
    let m1 = dayjs(d1);
    let m2 = dayjs(d2);
    let firstDateWasLater;

    if (m1.isSame(m2)) {
      return buildValueObject(0, 0, 0, 0, 0, 0, false);
    }
    if (m1.isAfter(m2)) {
      const tmp = m1;
      m1 = m2;
      m2 = tmp;
      firstDateWasLater = true;
    } else {
      firstDateWasLater = false;
    }

    let yDiff = m2.year() - m1.year();
    let mDiff = m2.month() - m1.month();
    let dDiff = m2.date() - m1.date();
    let hourDiff = m2.hour() - m1.hour();
    let minDiff = m2.minute() - m1.minute();
    let secDiff = m2.second() - m1.second();

    if (secDiff < 0) {
      secDiff = 60 + secDiff;
      minDiff -= 1;
    }
    if (minDiff < 0) {
      minDiff = 60 + minDiff;
      hourDiff -= 1;
    }
    if (hourDiff < 0) {
      hourDiff = 24 + hourDiff;
      dDiff -= 1;
    }
    if (dDiff < 0) {
      const daysInLastFullMonth = dayjs(`${m2.year()}-${m2.month() + 1}`).subtract(1, 'M').daysInMonth();
      if (daysInLastFullMonth < m1.date()) { // 31/01 -> 2/03
        dDiff = daysInLastFullMonth + dDiff + (m1.date() - daysInLastFullMonth);
      } else {
        dDiff = daysInLastFullMonth + dDiff;
      }
      mDiff -= 1;
    }
    if (mDiff < 0) {
      mDiff = 12 + mDiff;
      yDiff -= 1;
    }

    return buildValueObject(yDiff, mDiff, dDiff, hourDiff, minDiff, secDiff, firstDateWasLater);
  };

  const readableDifference = (a = '', b = '') => {
    try {
      const x = a ? dayjs(parseInt(a, 10)) : dayjs();
      const y = b ? dayjs(parseInt(b, 10)) : dayjs();
      return preciseDateDiff(x, y);
    } catch (error) {
      throw new Error(`Couldn't calculate date difference with error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const dateDiff = (time: string, countUp: boolean) => countUp ? readableDifference(time, '') : readableDifference('', time);

  // provide outputs for components
  const outputDateTimeReadableDiff = ref<string>('');
  const outputDateTimeFormatted = computed(() => formatDate(providedDateTime ?? Date.now()));

  const runDiff = () => {
    outputDateTimeReadableDiff.value = buildStringFromValues(dateDiff((providedDateTime ?? Date.now()).toString(), diffCountUp ?? false));
  };

  let interval: string | number | ReturnType<typeof setInterval> | undefined;
  onBeforeMount(() => {
    if (providedDateTime) {
      runDiff();
      interval = setInterval(() => {
        runDiff();
      }, 1000);
    }
  });

  onBeforeUnmount(() => {
    if (interval) {
      clearInterval(interval);
    }
  });

  return {
    formatDate,
    outputDateTimeReadableDiff,
    outputDateTimeFormatted,
  };
};

export default useDateTimeHelper;
