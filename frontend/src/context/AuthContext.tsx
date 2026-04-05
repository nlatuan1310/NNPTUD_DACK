import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import apiClient from '../services/apiClient';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'STAFF' | 'MANAGER';
  phone: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  isManager: boolean;
  isStaff: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Khi app khởi động, nếu có token thì fetch profile
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await apiClient.get('/auth/me');
          setUser(res.data.data);
        } catch {
          // Token hết hạn hoặc không hợp lệ
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    await apiClient.post('/auth/register', { name, email, password, phone });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const isManager = user?.role === 'MANAGER';
  const isStaff = user?.role === 'STAFF';
  const isCustomer = user?.role === 'CUSTOMER';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isManager, isStaff, isCustomer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
