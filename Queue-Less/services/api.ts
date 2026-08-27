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

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'GET',
        headers,
      });

      let data: any;
      try {
        data = await response.json();
      } catch (jsonErr) {
        data = { message: `Server returned HTTP status ${response.status}` };
      }

      if (!response.ok) {
        const error: any = new Error(data.message || 'API request failed');
        error.response = { data, status: response.status };
        throw error;
      }
      return { data, status: response.status };
    } catch (networkErr: any) {
      if (networkErr.response) throw networkErr;
      const customErr: any = new Error(
        `Cannot connect to backend server at ${API_BASE_URL}. Is Node.js server running?`
      );
      customErr.response = {
        data: { message: `Cannot connect to server at ${API_BASE_URL}. Ensure server is running on port 5000.` },
        status: 0,
      };
      throw customErr;
    }
  },

  async post<T>(url: string, body?: any): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      let data: any;
      try {
        data = await response.json();
      } catch (jsonErr) {
        data = { message: `Server returned HTTP status ${response.status}` };
      }

      if (!response.ok) {
        const error: any = new Error(data.message || 'API request failed');
        error.response = { data, status: response.status };
        throw error;
      }
      return { data, status: response.status };
    } catch (networkErr: any) {
      if (networkErr.response) throw networkErr;
      const customErr: any = new Error(
        `Cannot connect to backend server at ${API_BASE_URL}. Ensure server is running on port 5000.`
      );
      customErr.response = {
        data: { message: `Cannot connect to server at ${API_BASE_URL}. Ensure server is running on port 5000.` },
        status: 0,
      };
      throw customErr;
    }
  },
};

export default api;
