const REGISTRATION_TYPE_LABELS = {
  BASIC: 'Basic',
  PLUS: 'Plus',
  PRO: 'Pro',
  STARTER: 'Starter',
  UNLEASHED: 'Unleashed',
  LIFETIME: 'Lifetime',
  TRIAL: 'Trial',
  INVALID: 'Invalid',
} as const;

const REGISTRATION_DEVICE_LIMITS = {
  BASIC: 6,
  PLUS: 12,
  PRO: -1,
  STARTER: 6,
  UNLEASHED: -1,
  LIFETIME: -1,
  TRIAL: -1,
} as const;

const getRegistrationTypeKey = (registrationType?: string): string =>
  registrationType?.trim().toUpperCase() ?? '';

export const normalizeRegistrationType = (registrationType?: string): string => {
  const registrationTypeKey = getRegistrationTypeKey(registrationType);
  return (
    REGISTRATION_TYPE_LABELS[registrationTypeKey as keyof typeof REGISTRATION_TYPE_LABELS] ??
    registrationType ??
    ''
  );
};

export const getRegistrationDeviceLimit = (
  registrationType?: string,
  registeredDeviceLimit?: number
): number => {
  if (typeof registeredDeviceLimit === 'number' && registeredDeviceLimit > 0) {
    return registeredDeviceLimit;
  }

  const registrationTypeKey = getRegistrationTypeKey(registrationType);
  return REGISTRATION_DEVICE_LIMITS[registrationTypeKey as keyof typeof REGISTRATION_DEVICE_LIMITS] ?? 0;
};
