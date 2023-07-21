import { TimeStringsObject } from '~/types/time';

const buildStringFromValues = ({
  years, months, days, hours, minutes, seconds, firstDateWasLater, displaySeconds,
}: TimeStringsObject) => {
  const result = [];

  type DateStrings = {
    [key: string]: string;
  };
  const dateStrings: DateStrings = {
    year: 'year',
    years: 'years',
    month: 'month',
    months: 'months',
    day: 'day',
    days: 'days',
    hour: 'hour',
    hours: 'hours',
    minute: 'minute',
    minutes: 'minutes',
    second: 'second',
    seconds: 'seconds',
    firstDateWasLater: 'ago',
    delimiter: ' ',
  };
  const pluralize = (num: number, word: string) => {
    const index = word + (num === 1 ? '' : 's');
    return `${num} ${dateStrings[index]}`;
  };

  if (years) { result.push(pluralize(years, 'year')); }
  if (months) { result.push(pluralize(months, 'month')); }
  if (days) { result.push(pluralize(days, 'day')); }
  if (hours) { result.push(pluralize(hours, 'hour')); }
  if (minutes) { result.push(pluralize(minutes, 'minute')); }
  if (seconds && ((!years && !months && !days && !hours && !minutes) || displaySeconds)) { result.push(pluralize(seconds, 'second')); }
  if (firstDateWasLater) { result.push(dateStrings.firstDateWasLater); }
  return result.join(dateStrings.delimiter);
};

export default buildStringFromValues;
