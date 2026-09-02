import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Current machine Wi-Fi IP
const CURRENT_LOCAL_IP = '10.140.250.147';

const isValidIPv4 = (ip: string): boolean => {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
  });
};

const getBaseUrl = (): string => {
  // Web browser on laptop
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }

  // Extract dynamic IP host when running via Expo Go on physical phone (LAN mode)
  const debuggerHost =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).experienceUrl;

  if (debuggerHost && typeof debuggerHost === 'string') {
    const cleanHost = debuggerHost
      .replace(/^https?:\/\//, '')
      .replace(/^exp:\/\//, '');
    const ip = cleanHost.split(':')[0];
    if (ip && isValidIPv4(ip) && ip !== '127.0.0.1') {
      return `http://${ip}:5000/api`;
    }
  }

  // Fallback for native devices
  return `http://${CURRENT_LOCAL_IP}:5000/api`;
};

export const API_BASE_URL = getBaseUrl();

let authToken: string | null = null;

export const setAuthHeader = (token: string | null) => {
  authToken = token;
};

export interface ApiResponse<T> {
  data: T;
  status: number;
}

const REQUEST_TIMEOUT_MS = 15000;

const buildHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  return headers;
};

const handleNetworkError = (err: any): never => {
  if (err.response) throw err;
  const isTimeout = err.name === 'AbortError';
  const msg = isTimeout
    ? `Request timed out. Cannot connect to backend server at ${API_BASE_URL}. Ensure your phone and laptop are on the same Wi-Fi!`
    : `Network error: Cannot reach server at ${API_BASE_URL}. Please check if backend is running on port 5000.`;
  const wrapped: any = new Error(msg);
  wrapped.response = { data: { message: msg }, status: 0 };
  throw wrapped;
};

export const api = {
  async get<T>(url: string): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'GET',
        headers: buildHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timer);
      let data: any;
      try {
        data = await response.json();
      } catch {
        data = { message: `HTTP ${response.status}` };
      }
      if (!response.ok) {
        const e: any = new Error(data.message || 'Request failed');
        e.response = { data, status: response.status };
        throw e;
      }
      return { data, status: response.status };
    } catch (err: any) {
      clearTimeout(timer);
      return handleNetworkError(err);
    }
  },

  async post<T>(url: string, body?: any): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);
      let data: any;
      try {
        data = await response.json();
      } catch {
        data = { message: `HTTP ${response.status}` };
      }
      if (!response.ok) {
        const e: any = new Error(data.message || 'Request failed');
        e.response = { data, status: response.status };
        throw e;
      }
      return { data, status: response.status };
    } catch (err: any) {
      clearTimeout(timer);
      return handleNetworkError(err);
    }
  },

  async patch<T>(url: string, body?: any): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'PATCH',
        headers: buildHeaders(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);
      let data: any;
      try {
        data = await response.json();
      } catch {
        data = { message: `HTTP ${response.status}` };
      }
      if (!response.ok) {
        const e: any = new Error(data.message || 'Request failed');
        e.response = { data, status: response.status };
        throw e;
      }
      return { data, status: response.status };
    } catch (err: any) {
      clearTimeout(timer);
      return handleNetworkError(err);
    }
  },

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'DELETE',
        headers: buildHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timer);
      let data: any;
      try {
        data = await response.json();
      } catch {
        data = { message: `HTTP ${response.status}` };
      }
      if (!response.ok) {
        const e: any = new Error(data.message || 'Request failed');
        e.response = { data, status: response.status };
        throw e;
      }
      return { data, status: response.status };
    } catch (err: any) {
      clearTimeout(timer);
      return handleNetworkError(err);
    }
  },
};

export default api;
