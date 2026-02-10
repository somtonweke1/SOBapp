'use client';

import { AuthProvider } from '@/components/auth/auth-provider';
import LoginForm from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}