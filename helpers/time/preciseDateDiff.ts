import dayjs from 'dayjs';
import { TimeStringsObject } from '~/types/time';

/**
 * Original meat and potatos from:
 * @version: 1.0.1
 * @author: huangjinlin
 * @repo: https://github.com/huangjinlin/dayjs-precise-range
 */
const buildValueObject = (yDiff: number, mDiff: number, dDiff: number, hourDiff: number, minDiff: number, secDiff: number, firstDateWasLater: boolean): TimeStringsObject => ({
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

export default preciseDateDiff;
