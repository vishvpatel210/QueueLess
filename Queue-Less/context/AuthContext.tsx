import React, { createContext, useContext, useState } from 'react';
import authService from '../services/authService';
import {
  User,
  LoginCredentials,
  CustomerRegisterData,
  ShopAdminRegisterData,
} from '../types/user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  registerCustomer: (data: CustomerRegisterData) => Promise<User>;
  registerShopAdmin: (data: ShopAdminRegisterData) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: false,
  login: async () => ({} as User),
  registerCustomer: async () => ({} as User),
  registerShopAdmin: async () => ({} as User),
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const registerCustomer = async (data: CustomerRegisterData): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authService.registerCustomer(data);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const registerShopAdmin = async (data: ShopAdminRegisterData): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authService.registerShopAdmin(data);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        registerCustomer,
        registerShopAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
