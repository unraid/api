import dayjs from 'dayjs';

const formatDate = (date: string): string => dayjs(parseInt(date, 10)).format('llll');

export default formatDate;
