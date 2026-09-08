export type UserRole = 'CUSTOMER' | 'SHOP_ADMIN' | 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  pushToken?: string | null;
  createdAt: string;
}

export interface CustomerRegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword?: string;
}

export interface ShopAdminRegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword?: string;
  businessName: string;
  category: string;
  description?: string;
  website?: string;
  businessPhone?: string;
  businessEmail?: string;
  branchName: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  operatingHours?: { open: string; close: string };
  services?: Array<{
    name: string;
    description?: string;
    estimatedDurationMinutes: number;
    price?: number;
    prefix?: string;
  }>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}
