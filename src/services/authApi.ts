import { apiGet, apiPost, apiRequest, storeToken } from './apiClient';

export interface Identity {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'student';
  mobile?: string;
  college?: string;
  state?: string;
}

export interface RegistrationDetails {
  name: string;
  email: string;
  password: string;
  mobile: string;
  college: string;
  state: string;
}

export interface AuthMessage { message: string }

export const authApi = {
  async me() { return apiGet<Identity>('/api/auth/me'); },
  async login(email: string, password: string) {
    const result = await apiPost<{ access_token: string; user: Identity }>('/api/auth/login', { email, password });
    storeToken(result.access_token);
    return result.user;
  },
  register(details: RegistrationDetails) {
    return apiPost<AuthMessage>('/api/auth/register/request', details);
  },
  verifyRegistration(email: string, code: string) {
    return apiPost<AuthMessage>('/api/auth/register/verify', { email, code });
  },
  requestPasswordReset(email: string) {
    return apiPost<AuthMessage>('/api/auth/password/reset/request', { email });
  },
  confirmPasswordReset(email: string, code: string, newPassword: string) {
    return apiPost<AuthMessage>('/api/auth/password/reset/confirm', { email, code, new_password: newPassword });
  },
  async logout() { try { await apiRequest('/api/auth/logout', {method:'POST'}); } finally {storeToken(null);} }
};
