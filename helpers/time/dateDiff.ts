import dayjs from 'dayjs';
import preciseDateDiff from './preciseDateDiff';

const readbleDifference = (a = '', b = '') => {
  const x = a ? dayjs(parseInt(a, 10)) : dayjs();
  const y = b ? dayjs(parseInt(b, 10)) : dayjs();
  return preciseDateDiff(x, y);
};
const dateDiff = (time: string, countUp: boolean) => countUp ? readbleDifference(time, '') : readbleDifference('', time);

export default dateDiff;
