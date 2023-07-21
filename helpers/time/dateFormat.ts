import dayjs, { extend } from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

/** @see https://day.js.org/docs/en/display/format#localized-formats */
extend(localizedFormat);

const formatDate = (date: number): string => dayjs(date).format('llll');

export default formatDate;
