import { totp, authenticator } from 'otplib';

const twoFactorSecret = authenticator.generateSecret(64);

export const generateTwoFactorToken = () => totp.generate(twoFactorSecret);

export const verifyTwoFactorToken = (token: string) => totp.verify({ token, secret: twoFactorSecret });
