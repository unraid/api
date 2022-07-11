/* eslint-disable new-cap */
import { Number, String } from 'runtypes';

export const bytesAboveZero = Number.Or(String).withConstraint(bytes => global.Number(`${bytes}`) >= 0 || `Invalid size: "${bytes}"`);
