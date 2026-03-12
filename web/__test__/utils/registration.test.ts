import { describe, expect, it } from 'vitest';

import { getRegistrationDeviceLimit, normalizeRegistrationType } from '~/utils/registration';

describe('registration utils', () => {
  it('normalizes GraphQL enum registration types for display', () => {
    expect(normalizeRegistrationType('UNLEASHED')).toBe('Unleashed');
    expect(normalizeRegistrationType('PRO')).toBe('Pro');
    expect(normalizeRegistrationType('Plus')).toBe('Plus');
  });

  it('keeps unlimited license device counts when the registration type is uppercase', () => {
    expect(getRegistrationDeviceLimit('UNLEASHED', 0)).toBe(-1);
    expect(getRegistrationDeviceLimit('PRO', 0)).toBe(-1);
    expect(getRegistrationDeviceLimit('TRIAL', 0)).toBe(-1);
  });

  it('prefers an explicit device limit when one is provided', () => {
    expect(getRegistrationDeviceLimit('BASIC', 10)).toBe(10);
  });
});
