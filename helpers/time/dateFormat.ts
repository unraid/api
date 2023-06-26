import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(localizedFormat);

const formatDate = (date: number): string => {
  console.debug('[formatDate]', date, dayjs(date));
  return dayjs(date).format('llll');
}

export default formatDate;
