import { api } from './client';

export interface User {
  id: string;
  loginId: string;
  email: string;
  name: string;
  role: 'MANAGER' | 'STAFF';
}

export interface AuthResponse {
  ok: boolean;
  user: User;
}

export interface ForgotPasswordResponse {
  ok: boolean;
  message: string;
  email?: string;
}

export interface VerifyOtpResponse {
  ok: boolean;
  message: string;
  resetToken: string;
}

export interface ResetPasswordResponse {
  ok: boolean;
  message: string;
}

export const loginApi = async (credentials: { loginId: string; password: string }): Promise<User> => {
  const { data } = await api.post<AuthResponse>('/auth/login', credentials);
  return data.user;
};

export const signupApi = async (payload: {
  loginId: string;
  email: string;
  name: string;
  password: string;
}): Promise<User> => {
  const { data } = await api.post<AuthResponse>('/auth/signup', payload);
  return data.user;
};

export const logoutApi = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export const getMeApi = async (): Promise<User> => {
  const { data } = await api.get<AuthResponse>('/auth/me');
  return data.user;
};

export const forgotPasswordApi = async (identifier: string): Promise<ForgotPasswordResponse> => {
  const { data } = await api.post<ForgotPasswordResponse>('/auth/forgot-password', { identifier });
  return data;
};

export const verifyOtpApi = async (identifier: string, otp: string): Promise<VerifyOtpResponse> => {
  const { data } = await api.post<VerifyOtpResponse>('/auth/verify-otp', { identifier, otp });
  return data;
};

export const resetPasswordApi = async (resetToken: string, newPassword: string): Promise<ResetPasswordResponse> => {
  const { data } = await api.post<ResetPasswordResponse>('/auth/reset-password', {
    resetToken,
    newPassword
  });
  return data;
};
