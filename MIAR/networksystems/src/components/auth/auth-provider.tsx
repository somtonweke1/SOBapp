'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  company: string;
  permissions: string[];
  subscription: 'starter' | 'professional' | 'enterprise';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Mock user data for demo
  const mockUsers: Record<string, User> = {
    'admin@miar.com': {
      id: '1',
      name: 'Sarah Chen',
      email: 'admin@miar.com',
      role: 'admin',
      company: 'MIAR Platform',
      permissions: ['view_all', 'manage_users', 'configure_system', 'export_data', 'ai_insights'],
      subscription: 'enterprise'
    },
    'manager@mining.com': {
      id: '2',
      name: 'James Okafor',
      email: 'manager@mining.com',
      role: 'manager',
      company: 'West African Mining Corp',
      permissions: ['view_operations', 'manage_assets', 'export_data', 'ai_insights'],
      subscription: 'professional'
    },
    'operator@mine.co.za': {
      id: '3',
      name: 'Themba Mthembu',
      email: 'operator@mine.co.za',
      role: 'operator',
      company: 'Johannesburg Gold Mine',
      permissions: ['view_operations', 'update_status'],
      subscription: 'starter'
    }
  };

  useEffect(() => {
    setMounted(true);
    // Check for stored session only after mounting (client-side)
    const storedUser = localStorage.getItem('miar_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        // Clear invalid stored data
        localStorage.removeItem('miar_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = mockUsers[email];
    if (user && password === 'demo123') {
      setUser(user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('miar_user', JSON.stringify(user));
      }
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('miar_user');
    }
    // Don't automatically redirect to login - allow landing page access
    router.push('/');
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions.includes(permission) || false;
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, hasPermission }}>
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