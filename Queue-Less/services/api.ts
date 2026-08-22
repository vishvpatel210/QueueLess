import { Platform } from 'react-native';

const getDefaultBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getDefaultBaseUrl();

let authToken: string | null = null;

export const setAuthHeader = (token: string | null) => {
  authToken = token;
};

export interface ApiResponse<T> {
  data: T;
  status: number;
}

export const api = {
  async get<T>(url: string): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      const error: any = new Error(data.message || 'API request failed');
      error.response = { data, status: response.status };
      throw error;
    }
    return { data, status: response.status };
  },

  async post<T>(url: string, body?: any): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      const error: any = new Error(data.message || 'API request failed');
      error.response = { data, status: response.status };
      throw error;
    }
    return { data, status: response.status };
  },
};

export default api;
