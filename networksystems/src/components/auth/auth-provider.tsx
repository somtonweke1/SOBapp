'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';

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

function normalizePermissions(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }

    if (session?.user) {
      setUser({
        id: session.user.id,
        name: session.user.name || '',
        email: session.user.email || '',
        role: (session.user.role as User['role']) || 'viewer',
        company: session.user.company || 'Unknown',
        permissions: normalizePermissions(session.user.permissions),
        subscription: (session.user.subscription as User['subscription']) || 'starter',
      });
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, [session, status]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    const ok = !!result?.ok && !result?.error;
    setIsLoading(false);
    return ok;
  };

  const logout = () => {
    setUser(null);
    signOut({ redirect: false });
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
