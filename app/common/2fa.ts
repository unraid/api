import { randomBytes } from 'crypto';
import { totp } from 'otplib';

export const totpSecret = process.env.TOTP_SECRET ?? randomBytes(58).toString('hex');
export const generateTwoFactorCode = () => totp.generate(totpSecret);
