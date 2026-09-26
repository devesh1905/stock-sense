import jwt from 'jsonwebtoken';
import { config } from './config.js';

export interface UserTokenPayload {
  id: string;
  loginId: string;
  role: string;
}

export interface ResetTokenPayload {
  userId: string;
  otpId: string;
  type: 'password-reset';
}

export const generateToken = (payload: UserTokenPayload): string => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
};

export const verifyToken = (token: string): UserTokenPayload => {
  return jwt.verify(token, config.jwtSecret) as UserTokenPayload;
};

export const generateResetToken = (payload: { userId: string; otpId: string }): string => {
  return jwt.sign({ ...payload, type: 'password-reset' }, config.jwtSecret, { expiresIn: '15m' });
};

export const verifyResetToken = (token: string): ResetTokenPayload => {
  const decoded = jwt.verify(token, config.jwtSecret) as ResetTokenPayload;
  if (decoded.type !== 'password-reset') {
    throw new Error('Invalid token type');
  }
  return decoded;
};
