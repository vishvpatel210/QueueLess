import api, { setAuthHeader } from './api';
import {
  User,
  LoginCredentials,
  CustomerRegisterData,
  ShopAdminRegisterData,
  AuthResponse,
} from '../types/user';

export const authService = {
  async registerCustomer(data: CustomerRegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.data.token) {
      setAuthHeader(response.data.token);
    }
    return response.data;
  },

  async registerShopAdmin(data: ShopAdminRegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register-admin', data);
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
