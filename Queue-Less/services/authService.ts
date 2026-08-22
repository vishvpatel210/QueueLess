import api, { setAuthHeader } from './api';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../types/user';

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.data.token) {
      setAuthHeader(response.data.token);
    }
    return response.data;
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    if (response.data.token) {
      setAuthHeader(response.data.token);
    }
    return response.data;
  },

  async getMe(): Promise<{ success: boolean; user: User }> {
    const response = await api.get<{ success: boolean; user: User }>('/auth/me');
    return response.data;
  },

  logout() {
    setAuthHeader(null);
  },
};

export default authService;
